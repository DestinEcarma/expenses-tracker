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
    let categories_router = Router::new().route("/create", post(categories::create));
    let category_router = Router::new()
        .route("/edit", patch(categories::edit))
        .route("/delete", delete(categories::delete));

    let transactions_router = Router::new()
        .route("/create", post(transactions::create))
        .route("/list", get(transactions::list));
    let transaction_router = Router::new()
        .route("/edit", patch(transactions::edit))
        .route("/delete", delete(transactions::delete));

    Router::new()
        .route("/list-overview", get(handlers::get_expenses_overview))
        .nest(
            "/categories",
            categories_router.nest(
                "/{id}",
                category_router.nest(
                    "/transactions",
                    transactions_router.nest("/{id}", transaction_router),
                ),
            ),
        )
        .layer(middleware::from_fn_with_state(state, require_auth))
}
