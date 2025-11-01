use anyhow::anyhow;
use axum::{
    Json, Router,
    extract::{Path, State},
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};

use axum_extra::extract::CookieJar;
use dotenvy::dotenv;
use rust_embed::Embed;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, SqlitePool, sqlite::SqliteConnectOptions};
use std::{env, fs, net::SocketAddr};
use uuid::Uuid;

const COOKIE_NAME: &str = "beebfam-key";

#[derive(sqlx::FromRow, Debug, Deserialize, Serialize, Clone, Default)]
struct Item {
    id: String,
    name: String,
    created_at: i64,
}

#[derive(Deserialize, Serialize, Clone, Default, Debug)]
struct ItemResponse {
    items: Vec<Item>,
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

    let addr = SocketAddr::from(([127, 0, 0, 1], 8082));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/index.html", get(index_handler))
        .route("/assets/{*file}", get(static_handler))
        .route("/get-items", get(get_items_handler))
        .route("/add-item", post(add_item_handler))
        .route("/{id}/delete-item", post(delete_item_handler))
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

#[derive(Deserialize)]
struct ItemRequest {
    name: String,
}

async fn add_item_handler(
    State(state): State<AppState>,
    cookies: CookieJar,
    Json(req): Json<ItemRequest>,
) -> Result<Json<ItemResponse>, AppError> {
    if cookies
        .get(COOKIE_NAME)
        .is_none_or(|val| val.value().trim() != state.key)
    {
        return Err(AppError(anyhow!("Nope, sorry")));
    }

    let id = Uuid::new_v4().to_string();
    sqlx::query!(
        r"
        INSERT INTO items (id, name) VALUES (?1, ?2) 
        ",
        id,
        req.name
    )
    .execute(&state.pool)
    .await?;

    let items = get_items(&state.pool).await?;
    Ok(Json(ItemResponse { items }))
}

async fn delete_item_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
    cookies: CookieJar,
) -> Result<Json<ItemResponse>, AppError> {
    if cookies
        .get(COOKIE_NAME)
        .is_none_or(|val| val.value().trim() != state.key)
    {
        return Err(AppError(anyhow!("Nope, sorry")));
    }

    sqlx::query!(
        r"
        DELETE FROM items WHERE id = ?1
        ",
        id
    )
    .execute(&state.pool)
    .await?;

    let items = get_items(&state.pool).await?;
    Ok(Json(ItemResponse { items }))
}

async fn get_items(pool: &Pool<Sqlite>) -> anyhow::Result<Vec<Item>> {
    let items = sqlx::query_as!(
        Item,
        r"
        SELECT * FROM items
        ",
    )
    .fetch_all(pool)
    .await?;

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
