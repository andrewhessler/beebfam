use axum::{
    Json, Router,
    extract::State,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};

use dotenvy::dotenv;
use rust_embed::Embed;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, SqlitePool, sqlite::SqliteConnectOptions};
use std::{env, fs, net::SocketAddr};

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone, Default)]
struct AerobicItem {
    id: i64,
    name: String,
    duration_min: Option<f64>,
    distance: Option<f64>,
    date: i64,
}

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone, Default)]
struct AnaerobicItem {
    id: i64,
    name: String,
    weight: Option<f64>,
    sets: Option<i64>,
    reps: Option<i64>,
    date: i64,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(untagged)]
enum ExerciseItem {
    Aerobic(AerobicItem),
    Anaerobic(AnaerobicItem),
}

#[derive(Deserialize, Serialize, Clone, Default, Debug)]
struct ItemResponse {
    items: Vec<ExerciseItem>,
}

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone, Default)]
struct AerobicTemplate {
    name: String,
    duration_min: Option<f64>,
    distance: Option<f64>,
}

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone, Default)]
struct AnaerobicTemplate {
    name: String,
    weight: Option<f64>,
    sets: Option<i64>,
    reps: Option<i64>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(untagged)]
enum ExerciseTemplate {
    Aerobic(AerobicTemplate),
    Anaerobic(AnaerobicTemplate),
}

#[derive(Deserialize, Serialize, Clone, Default, Debug)]
struct TemplateResponse {
    templates: Vec<ExerciseTemplate>,
}

#[derive(Clone, Debug)]
struct AppState {
    pub pool: Pool<Sqlite>,
    pub key: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    _ = dotenv();
    let raw_database_url = env::var("DATABASE_URL").expect("DATABASE_URL to be defined");
    let database_url = raw_database_url.split(":").last().unwrap();

    let connection_options = SqliteConnectOptions::new()
        .filename(database_url)
        .create_if_missing(true);
    let pool = SqlitePool::connect_with(connection_options).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    let key_path = std::env::var("KEY_PATH")?;
    let key = fs::read_to_string(key_path)?.trim().to_string();

    let addr = SocketAddr::from(([127, 0, 0, 1], 8085));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/index.html", get(index_handler))
        .route("/assets/{*file}", get(static_handler))
        .route("/get-items", get(get_items_handler))
        .route("/get-templates", get(get_templates_handler))
        .route("/add-item", post(add_item_handler))
        .with_state(AppState { pool, key });

    println!("listening on {addr}");
    _ = axum::serve(listener, app).await;
    Ok(())
}

async fn index_handler() -> impl IntoResponse {
    static_handler("/index.html".parse::<Uri>().unwrap()).await
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/').to_string();

    StaticFile(path)
}

async fn get_items_handler(State(state): State<AppState>) -> Result<Json<ItemResponse>, AppError> {
    let items = get_items(&state.pool).await?;
    Ok(Json(ItemResponse { items }))
}

async fn get_templates_handler(
    State(state): State<AppState>,
) -> Result<Json<TemplateResponse>, AppError> {
    let templates = get_templates(&state.pool).await?;
    Ok(Json(TemplateResponse { templates }))
}

#[derive(Deserialize, Debug)]
struct AerobicRequest {
    name: String,
    duration_min: Option<f64>,
    distance: Option<f64>,
}

#[derive(Deserialize, Debug)]
struct AnaerobicRequest {
    name: String,
    weight: Option<f64>,
    sets: Option<i64>,
    reps: Option<i64>,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ExerciseItemRequest {
    Aerobic(AerobicRequest),
    Anaerobic(AnaerobicRequest),
}

#[auth_macro::auth_guard]
async fn add_item_handler(
    State(state): State<AppState>,
    Json(req): Json<ExerciseItemRequest>,
) -> Result<Json<ItemResponse>, AppError> {
    let now = chrono::Utc::now().timestamp();

    println!("{req:?}");
    match req {
        ExerciseItemRequest::Aerobic(req) => {
            sqlx::query!(
                r"
                INSERT INTO aerobic (name, duration_min, distance, date) VALUES (?1, ?2, ?3, ?4) 
                ",
                req.name,
                req.duration_min,
                req.distance,
                now
            )
            .execute(&state.pool)
            .await?;
        }
        ExerciseItemRequest::Anaerobic(req) => {
            sqlx::query!(
                r"
                INSERT INTO anaerobic (name, weight, sets, reps, date) VALUES (?1, ?2, ?3, ?4, ?5) 
                ",
                req.name,
                req.weight,
                req.sets,
                req.reps,
                now
            )
            .execute(&state.pool)
            .await?;
        }
    }

    let items = get_items(&state.pool).await?;
    Ok(Json(ItemResponse { items }))
}

/// used to return state after mutations and for initial state grab
async fn get_items(pool: &Pool<Sqlite>) -> anyhow::Result<Vec<ExerciseItem>> {
    let aerobic_items = sqlx::query_as!(
        AerobicItem,
        r"
        SELECT * FROM aerobic
        ORDER BY date
        LIMIT 100
        ",
    )
    .fetch_all(pool)
    .await?;

    let anaerobic_items = sqlx::query_as!(
        AnaerobicItem,
        r"
        SELECT * FROM anaerobic
        ORDER BY date
        LIMIT 100
        ",
    )
    .fetch_all(pool)
    .await?;

    let items: Vec<ExerciseItem> = aerobic_items
        .into_iter()
        .map(ExerciseItem::Aerobic)
        .chain(anaerobic_items.into_iter().map(ExerciseItem::Anaerobic))
        .collect();

    Ok(items)
}

async fn get_templates(pool: &Pool<Sqlite>) -> anyhow::Result<Vec<ExerciseTemplate>> {
    let aerobic_templates = sqlx::query_as!(
        AerobicTemplate,
        r"
        SELECT * FROM aerobic_template
        ",
    )
    .fetch_all(pool)
    .await?;

    let anaerobic_templates = sqlx::query_as!(
        AnaerobicTemplate,
        r"
        SELECT * FROM anaerobic_template
        ",
    )
    .fetch_all(pool)
    .await?;

    let items: Vec<ExerciseTemplate> = aerobic_templates
        .into_iter()
        .map(ExerciseTemplate::Aerobic)
        .chain(
            anaerobic_templates
                .into_iter()
                .map(ExerciseTemplate::Anaerobic),
        )
        .collect();

    Ok(items)
}

pub struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

#[derive(Embed)]
#[folder = "src/client/dist/"]
struct Asset;

pub struct StaticFile<T>(pub T);

impl<T> IntoResponse for StaticFile<T>
where
    T: Into<String>,
{
    fn into_response(self) -> Response {
        let path = self.0.into();

        match Asset::get(path.as_str()) {
            Some(content) => {
                let mime = mime_guess::from_path(path).first_or_octet_stream();
                ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response()
            }
            None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
        }
    }
}
