mod auth;
mod defs;
mod error;
mod expenses;

use std::sync::Arc;

use axum::Router;

pub use crate::api::error::ApiError;

use crate::{
    api::auth::jwt::{JwtKeys, JwtVerifier},
    db::{ApiDb, init_db},
};

struct ApiState {
    db: ApiDb,
    jwt_keys: JwtKeys,
    jwt_verifier: JwtVerifier,
}

pub async fn router() -> Result<Router, ApiError> {
    let api_state = Arc::new(ApiState {
        db: init_db().await?,
        jwt_keys: JwtKeys::new_from_env(),
        jwt_verifier: JwtVerifier::hs256_from_env(),
    });

    Ok(Router::new()
        .nest("/auth", auth::router(api_state.clone()))
        .nest("/expenses", expenses::router(api_state.clone()))
        .with_state(api_state))
}
