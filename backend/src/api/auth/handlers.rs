use std::{collections::HashMap, str::FromStr, sync::Arc};

use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};
use chrono::{DateTime, TimeZone, Utc};
use email_address::EmailAddress;
use jsonwebtoken::decode;
use serde_json::json;
use surrealdb::Datetime;
use tokio::task;

use crate::{
    api::{
        ApiError, ApiState,
        auth::{
            defs::{AuthResponse, SignInPayload, SignUpPayload},
            extractor::AuthUser,
            jwt::Claims,
            util::{hash_password, verify_password},
        },
    },
    config::config,
    db::repo::UserRepo,
};

pub async fn sign_up(
    State(state): State<Arc<ApiState>>,
    Json(payload): Json<SignUpPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = UserRepo::new(&state.db);

    let email = EmailAddress::from_str(&payload.email.to_lowercase()).map_err(|_| {
        ApiError::Validation(json!({
            "email": "Please enter a valid email"
        }))
    })?;

    let username = payload.username.to_lowercase();
    let password = payload.password;

    let (email_exists, username_exists) = repo.exists(email.clone(), username.clone()).await?;

    let mut exists = HashMap::new();

    if email_exists {
        exists.insert("email", "Email already exists");
    }

    if username_exists {
        exists.insert("username", "Username already exists");
    }

    if !exists.is_empty() {
        return Err(ApiError::AlreadyExists(json!(exists)));
    }

    let password_hash =
        task::spawn_blocking(move || hash_password(password, &config().pepper)).await??;

    let user_id = repo
        .create(email, username, password_hash)
        .await?
        .to_string();

    let (access, expires_at) = state.jwt_keys.mk_access(&user_id)?;
    let refresh = state.jwt_keys.mk_refresh(&user_id)?;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            access_token: access,
            refresh_token: refresh,
            token_type: "Bearer",
            expires_at: Datetime::from(DateTime::from_timestamp(expires_at, 0).unwrap()),
        }),
    ))
}

pub async fn sign_in(
    State(state): State<Arc<ApiState>>,
    Json(payload): Json<SignInPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = UserRepo::new(&state.db);

    let user_auth = repo
        .get_by_username(payload.username.to_lowercase())
        .await?;

    let user_id = user_auth.id.to_string();
    let candidate_pw = payload.password;
    let stored_hash = user_auth.password_hash;

    let verified =
        task::spawn_blocking(move || verify_password(candidate_pw, &stored_hash, &config().pepper))
            .await??;

    if !verified {
        return Err(ApiError::Unauthorized(serde_json::json!({
            "password": "Incorrect password"
        })));
    }

    let (access, expires_at) = state.jwt_keys.mk_access(&user_id)?;
    let refresh = state.jwt_keys.mk_refresh(&user_id)?;

    Ok(Json(AuthResponse {
        access_token: access,
        refresh_token: refresh,
        token_type: "Bearer",
        expires_at: Datetime::from(Utc.timestamp_nanos(expires_at * 1_000_000)),
    }))
}

pub async fn refresh(
    State(state): State<Arc<ApiState>>,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
) -> Result<impl IntoResponse, ApiError> {
    let token = bearer.token();

    let data = decode::<Claims>(token, &state.jwt_verifier.dec, &state.jwt_verifier.val)?;

    if data.claims.scope.as_deref() != Some("refresh") {
        return Err(ApiError::Unauthorized("InvalidScope".into()));
    }

    let user_id = data.claims.sub;

    let (access, expires_at) = state.jwt_keys.mk_access(&user_id)?;
    let refresh = state.jwt_keys.mk_refresh(&user_id)?;

    Ok(Json(AuthResponse {
        access_token: access,
        refresh_token: refresh,
        token_type: "Bearer",
        expires_at: Datetime::from(DateTime::from_timestamp(expires_at, 0).unwrap()),
    }))
}

pub async fn me(_: AuthUser) -> impl IntoResponse {
    StatusCode::NO_CONTENT
}
