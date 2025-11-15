mod categories;
mod handlers;
mod transactions;

use std::sync::Arc;

use axum::{
    Router, middleware,
    routing::{delete, get, patch, post},
};

use crate::api::{ApiState, auth::middleware::require_auth};

pub fn router(state: Arc<ApiState>) -> Router<Arc<ApiState>> {
    let categories_router = Router::new().route("/", post(categories::create));
    let category_router = Router::new()
        .route("/edit", patch(categories::edit))
        .route("/delete", delete(categories::delete));

    let transactions_router =
        Router::new().route("/", get(transactions::list).post(transactions::create));

    Router::new()
        .route("/", get(handlers::get_expenses_overview))
        .nest(
            "/categories",
            categories_router.nest(
                "/{id}",
                category_router.nest("/transactions", transactions_router),
            ),
        )
        .layer(middleware::from_fn_with_state(state, require_auth))
}
