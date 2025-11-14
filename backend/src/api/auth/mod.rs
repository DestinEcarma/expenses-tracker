pub mod defs;
pub mod extractor;
mod handlers;
pub mod jwt;
pub mod middleware;
mod util;

use std::sync::Arc;

use axum::{
    Router,
    routing::{get, post},
};

use crate::api::{ApiState, auth::middleware::require_auth};

pub fn router(state: Arc<ApiState>) -> Router<Arc<ApiState>> {
    Router::new()
        .route("/sign-up", post(handlers::sign_up))
        .route("/sign-in", post(handlers::sign_in))
        .route("/refresh", post(handlers::refresh))
        .route(
            "/me",
            get(handlers::me)
                .route_layer(axum::middleware::from_fn_with_state(state, require_auth)),
        )
}
