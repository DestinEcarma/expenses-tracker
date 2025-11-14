use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use surrealdb::RecordId;

use crate::{
    api::{ApiError, ApiState, auth::extractor::AuthUser, defs::DateRange},
    db::{
        DbError,
        repo::{CategoryRepo, transaction_repo::TransactionRepo},
    },
};

#[derive(Deserialize)]
pub struct CreateItemPayload {
    pub amount: f64,
    pub note: Option<String>,
}

pub async fn create(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    auth: AuthUser,
    Json(payload): Json<CreateItemPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let category_repo = CategoryRepo::new(&state.db);
    let transaction_repo = TransactionRepo::new(&state.db);

    let category_id = RecordId::from_table_key("category", category_id);

    if !(category_repo
        .user_owns(auth.user_id, category_id.clone())
        .await?)
    {
        return Err(ApiError::Db(DbError::NotFound(
            "User does not own this category".into(),
        )));
    }

    transaction_repo
        .create(category_id, payload.amount, payload.note)
        .await?;

    Ok(StatusCode::CREATED)
}

pub async fn list(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    Query(range): Query<DateRange>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = TransactionRepo::new(&state.db);

    let category_id = RecordId::from_table_key("category", category_id);

    let transactions = repo.list(category_id, range.start, range.end).await?;

    Ok(Json(transactions))
}
