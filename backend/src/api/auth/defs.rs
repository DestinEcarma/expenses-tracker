use serde::{Deserialize, Serialize};
use surrealdb::Datetime;

#[derive(Deserialize)]
pub struct SignUpPayload {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct SignInPayload {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: &'static str,
    pub expires_at: Datetime,
}
