mod categories;
mod handlers;
mod transactions;

use std::sync::Arc;

use axum::{
    Router, middleware,
    routing::{get, post},
};

use crate::api::{ApiState, auth::middleware::require_auth};

pub fn router(state: Arc<ApiState>) -> Router<Arc<ApiState>> {
    Router::new()
        .route("/", get(handlers::get_expenses_overview))
        .nest(
            "/categories",
            Router::new().route("/", post(categories::create)).route(
                "/{id}/transactions",
                get(transactions::list).post(transactions::create),
            ),
        )
        .layer(middleware::from_fn_with_state(state, require_auth))
}
