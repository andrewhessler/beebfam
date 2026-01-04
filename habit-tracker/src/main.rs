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

const DAYS_TO_FETCH: i64 = 7;

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone)]
struct Habit {
    id: i64,
    name: String,
    date: String,
    updated_at: i64,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct HabitsResponse {
    habits: Vec<Habit>,
}

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone)]
struct HabitTemplate {
    name: String,
    max_occurrences: Option<i64>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct TemplatesResponse {
    templates: Vec<HabitTemplate>,
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

    let addr = SocketAddr::from(([127, 0, 0, 1], 8086));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/index.html", get(index_handler))
        .route("/assets/{*file}", get(static_handler))
        .route("/get-habits", get(get_habits_handler))
        .route("/get-templates", get(get_templates_handler))
        .route("/add-habit", post(add_habit_handler))
        .route("/undo-last", post(undo_last_handler))
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

async fn get_habits_handler(
    State(state): State<AppState>,
) -> Result<Json<HabitsResponse>, AppError> {
    let habits = get_habits_since(&state.pool).await?;
    Ok(Json(HabitsResponse { habits }))
}

#[derive(Deserialize, Debug)]
struct AddHabitRequest {
    name: String,
    date: String,
}

#[auth_macro::auth_guard]
async fn add_habit_handler(
    State(state): State<AppState>,
    Json(req): Json<AddHabitRequest>,
) -> Result<Json<HabitsResponse>, AppError> {
    let now = chrono::Utc::now().timestamp();

    sqlx::query!(
        r"
        INSERT INTO habits (name, date, updated_at) VALUES (?1, ?2, ?3) 
        ",
        req.name,
        req.date,
        now
    )
    .execute(&state.pool)
    .await?;

    let habits = get_habits_since(&state.pool).await?;
    Ok(Json(HabitsResponse { habits }))
}

#[auth_macro::auth_guard]
async fn undo_last_handler(
    State(state): State<AppState>,
) -> Result<Json<HabitsResponse>, AppError> {
    sqlx::query!(
        r"
        DELETE FROM habits 
        WHERE id = (SELECT id FROM habits ORDER BY updated_at DESC LIMIT 1)
        "
    )
    .execute(&state.pool)
    .await?;

    let habits = get_habits_since(&state.pool).await?;
    Ok(Json(HabitsResponse { habits }))
}

async fn get_templates_handler(
    State(state): State<AppState>,
) -> Result<Json<TemplatesResponse>, AppError> {
    let templates = get_templates(&state.pool).await?;
    Ok(Json(TemplatesResponse { templates }))
}

async fn get_habits_since(pool: &Pool<Sqlite>) -> anyhow::Result<Vec<Habit>> {
    let cutoff_date = chrono::Utc::now()
        .checked_sub_signed(chrono::Duration::days(DAYS_TO_FETCH))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    let habits = sqlx::query_as!(
        Habit,
        r"
        SELECT id, name, date, updated_at FROM habits
        WHERE date >= ?1
        ORDER BY date DESC, updated_at DESC
        ",
        cutoff_date
    )
    .fetch_all(pool)
    .await?;

    Ok(habits)
}

async fn get_templates(pool: &Pool<Sqlite>) -> anyhow::Result<Vec<HabitTemplate>> {
    let templates = sqlx::query_as!(
        HabitTemplate,
        r"
        SELECT name, max_occurrences FROM habit_template
        ORDER BY name
        "
    )
    .fetch_all(pool)
    .await?;

    Ok(templates)
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
