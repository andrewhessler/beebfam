use axum::{
    Json, Router,
    extract::State,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use reqwest::header::{HeaderMap, HeaderValue};

use axum_extra::extract::{CookieJar, cookie::Cookie};
use chrono::Utc;
use dotenvy::dotenv;
use rust_embed::Embed;
use serde::Deserialize;
use serde_json::json;
use std::{env, fs, net::SocketAddr};
use time::OffsetDateTime;

const COOKIE_NAME: &str = "beebfam-key";
const ONE_YEAR_IN_SECONDS: i64 = 31_556_952;

#[derive(Clone, Debug)]
struct AppState {
    pub key: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    _ = dotenv();

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;

    let key_path = std::env::var("KEY_PATH")?;
    let key = fs::read_to_string(key_path)?.trim().to_string();

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/index.html", get(index_handler))
        .route("/assets/{*file}", get(static_handler))
        .route("/login", post(login_handler))
        .route("/light-control", post(light_control_handler))
        .with_state(AppState { key });

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

#[derive(Deserialize)]
struct LightRequest {
    requests: Vec<LightItem>,
}

#[derive(Deserialize)]
struct LightItem {
    name: String,
    toggle: bool,
}

#[auth_macro::auth_guard]
async fn light_control_handler(
    State(state): State<AppState>,
    Json(req): Json<LightRequest>,
) -> Result<(), AppError> {
    let mut headers = HeaderMap::new();
    headers.insert(
        "Govee-API-Key",
        HeaderValue::from_str(&env::var("GOVEE_KEY").unwrap()).unwrap(),
    );

    let client = reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .unwrap();

    for req in req.requests {
        if let Some(device) = get_device(&req.name) {
            client
                .post("https://openapi.api.govee.com/router/api/v1/device/control")
                .json(&json!({
                    "requestId": "uuid",
                    "payload": {
                        "sku": device.sku,
                        "device": device.device,
                        "capability": {
                            "type": "devices.capabilities.on_off",
                            "instance": "powerSwitch",
                            "value": req.toggle as u32
                       }
                    }
                }))
                .send()
                .await
                .unwrap();
        }
    }
    Ok(())
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeviceInfo {
    device: String,
    sku: String,
}

fn get_device(device_name: &str) -> Option<DeviceInfo> {
    match device_name {
        "tall living room" => Some(DeviceInfo {
            device: "1A:A6:D4:AD:FC:EF:A6:1B".to_string(),
            sku: "H5080".to_string(),
        }),
        "small living room" => Some(DeviceInfo {
            device: "61:F6:D4:AD:FC:F3:6A:0F".to_string(),
            sku: "H5080".to_string(),
        }),
        "bubble lamp" => Some(DeviceInfo {
            device: "38:31:D4:AD:FC:A8:91:CB".to_string(),
            sku: "H5080".to_string(),
        }),
        "bedroom black" => Some(DeviceInfo {
            device: "44:CB:D4:AD:FC:EF:A5:E1".to_string(),
            sku: "H5080".to_string(),
        }),
        "studio lights" => Some(DeviceInfo {
            device: "67:5D:CD:2A:06:06:46:5F".to_string(),
            sku: "H612D".to_string(),
        }),
        _ => None,
    }
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
