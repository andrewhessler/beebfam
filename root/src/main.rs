use axum::{
    Json, Router,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};

use axum_extra::extract::{CookieJar, cookie::Cookie};
use chrono::Utc;
use dotenvy::dotenv;
use rust_embed::Embed;
use serde::Deserialize;
use std::{fs, net::SocketAddr};
use time::OffsetDateTime;

const COOKIE_NAME: &str = "beebfam-key";
const ONE_YEAR_IN_SECONDS: i64 = 31_556_952;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    _ = dotenv();

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/index.html", get(index_handler))
        .route("/assets/{*file}", get(static_handler))
        .route("/login", post(login_handler));

    println!("listening on {addr}");
    _ = axum::serve(listener, app).await;
    Ok(())
}

#[derive(Deserialize)]
struct LoginRequest {
    password: String,
}

async fn index_handler() -> impl IntoResponse {
    static_handler("/index.html".parse::<Uri>().unwrap()).await
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/').to_string();

    StaticFile(path)
}

async fn login_handler(
    cookies: CookieJar,
    Json(req): Json<LoginRequest>,
) -> Result<CookieJar, AppError> {
    let pw_path = std::env::var("PASSWORD_PATH")?;
    let pw = fs::read_to_string(pw_path)?;
    let key_path = std::env::var("KEY_PATH")?;
    let key = fs::read_to_string(key_path)?;

    if cookies
        .get(COOKIE_NAME)
        .is_some_and(|val| val.value() == key.trim())
    {
        return Ok(cookies);
    }

    let updated_cookies = if req.password.trim() == pw.trim() {
        cookies.add(
            Cookie::build((COOKIE_NAME, key.trim().to_string()))
                .path("/")
                .expires(
                    OffsetDateTime::from_unix_timestamp(
                        Utc::now().timestamp() + ONE_YEAR_IN_SECONDS,
                    )
                    .unwrap(),
                )
                .domain(".beebfam.org"),
        )
    } else {
        return Err(AppError(anyhow::anyhow!("Nope, sorry")));
    };

    Ok(updated_cookies)
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
#[folder = "public/"]
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
