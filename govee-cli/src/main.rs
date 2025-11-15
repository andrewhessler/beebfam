use std::{env, io::Write};

use reqwest::header::{HeaderMap, HeaderValue};
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize, Debug)]
struct Response {
    data: Vec<DeviceInfo>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeviceInfo {
    device_name: String,
    device: String,
    sku: String,
}

impl serde::Serialize for DeviceInfo {
    #[inline]
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        <String as serde::Serialize>::serialize(&self.device_name, serializer)
    }
}

fn main() {
    dotenvy::dotenv().unwrap();

    let mut headers = HeaderMap::new();
    headers.insert(
        "Govee-API-Key",
        HeaderValue::from_str(&env::var("GOVEE_KEY").unwrap()).unwrap(),
    );

    let client = reqwest::blocking::Client::builder()
        .default_headers(headers)
        .build()
        .unwrap();

    let res: Response = client
        .get("https://openapi.api.govee.com/router/api/v1/user/devices")
        .send()
        .unwrap()
        .json()
        .unwrap();

    for (index, device) in res.data.iter().enumerate() {
        println!("{index}: {:?}", device);
    }

    print!("Toggle: ");
    _ = std::io::stdout().flush();
    let mut input = String::new();

    std::io::stdin().read_line(&mut input).unwrap();

    let device_choice: usize = input.trim().parse().unwrap();
    let device = res.data.get(device_choice).unwrap();

    print!("On (1)/Off (0): ");
    _ = std::io::stdout().flush();
    let mut input = String::new();

    std::io::stdin().read_line(&mut input).unwrap();

    let on_off: usize = input.trim().parse().unwrap();

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
                    "value": on_off
                }
            }
        }))
        .send()
        .unwrap();
}
