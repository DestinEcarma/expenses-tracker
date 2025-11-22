use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use surrealdb::{Datetime, RecordId};

use crate::{
    api::{ApiError, ApiState, auth::extractor::AuthUser, defs::DateRange},
    db::{
        DbError,
        repo::{CategoryRepo, transaction_repo::TransactionRepo},
    },
    models::Transaction,
};

#[derive(Deserialize)]
pub struct ItemPayload {
    pub amount: f64,
    pub note: Option<String>,
    pub date: Datetime,
}

pub async fn create(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    auth: AuthUser,
    Json(payload): Json<ItemPayload>,
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

    let transaction_id = transaction_repo
        .create(
            category_id,
            payload.amount,
            payload.note.clone(),
            payload.date.clone(),
        )
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(Transaction {
            id: transaction_id,
            amount: payload.amount,
            note: payload.note,
            date: payload.date,
        }),
    ))
}

pub async fn edit(
    State(state): State<Arc<ApiState>>,
    Path((_, transaction_id)): Path<(String, String)>,
    auth: AuthUser,
    Json(payload): Json<ItemPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = TransactionRepo::new(&state.db);

    let transaction_id = RecordId::from_table_key("transaction", transaction_id);

    if !(repo.user_owns(auth.user_id, transaction_id.clone()).await?) {
        return Err(ApiError::Db(DbError::NotFound(
            "User does not own this transaction".into(),
        )));
    }

    repo.edit(
        transaction_id.clone(),
        payload.amount,
        payload.note.clone(),
        payload.date.clone(),
    )
    .await?;

    Ok((
        StatusCode::OK,
        Json(Transaction {
            id: transaction_id,
            amount: payload.amount,
            note: payload.note,
            date: payload.date,
        }),
    ))
}

pub async fn delete(
    State(state): State<Arc<ApiState>>,
    Path((_, transaction_id)): Path<(String, String)>,
    auth: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    let repo = TransactionRepo::new(&state.db);

    let transaction_id = RecordId::from_table_key("transaction", transaction_id);

    if !(repo.user_owns(auth.user_id, transaction_id.clone()).await?) {
        return Err(ApiError::Db(DbError::NotFound(
            "User does not own this transaction".into(),
        )));
    }

    repo.delete(transaction_id).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    Query(range): Query<DateRange>,
    auth: AuthUser,
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

    let transactions = transaction_repo
        .list(category_id, range.start, range.end)
        .await?;

    Ok(Json(transactions))
}
