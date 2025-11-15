use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use surrealdb::RecordId;

use crate::{
    api::{ApiError, ApiState, auth::extractor::AuthUser},
    db::{DbError, repo::CategoryRepo},
    models::Category,
};

#[derive(Deserialize)]
pub struct ItemPayload {
    name: String,
    icon: String,
}

#[derive(Serialize)]
pub struct EditedCategory {
    name: String,
    icon: String,
}

pub async fn create(
    State(state): State<Arc<ApiState>>,
    auth: AuthUser,
    Json(payload): Json<ItemPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = CategoryRepo::new(&state.db);

    let user_id = auth.user_id;
    let name = payload.name;
    let icon = payload.icon;

    if repo.exists(user_id.clone(), name.clone()).await? {
        return Err(ApiError::AlreadyExists(json!(
            {"name": "Category with this name already exists"}
        )));
    }

    let category_id = repo.create(user_id, name.clone(), icon.clone()).await?;

    Ok((
        StatusCode::CREATED,
        Json(Category {
            id: category_id,
            name,
            icon,
            amount: 0.0,
            transactions: 0,
        }),
    ))
}

pub async fn edit(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    auth: AuthUser,
    Json(payload): Json<ItemPayload>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = CategoryRepo::new(&state.db);

    let user_id = auth.user_id;
    let category_id = RecordId::from_table_key("category", category_id);
    let name = payload.name;
    let icon = payload.icon;

    if repo.exists(user_id.clone(), name.clone()).await? {
        return Err(ApiError::AlreadyExists(json!(
            {"name": "Category with this name already exists"}
        )));
    }

    if !(repo.user_owns(user_id.clone(), category_id.clone()).await?) {
        return Err(ApiError::Db(DbError::NotFound(
            "User does not own this category".into(),
        )));
    }

    repo.edit(user_id, category_id, name.clone(), icon.clone())
        .await?;

    Ok((StatusCode::OK, Json(EditedCategory { name, icon })))
}

pub async fn delete(
    State(state): State<Arc<ApiState>>,
    Path(category_id): Path<String>,
    auth: AuthUser,
) -> Result<impl IntoResponse, ApiError> {
    let repo = CategoryRepo::new(&state.db);

    let user_id = auth.user_id;
    let category_id = RecordId::from_table_key("category", category_id);

    if !(repo.user_owns(user_id.clone(), category_id.clone()).await?) {
        return Err(ApiError::Db(DbError::NotFound(
            "User does not own this category".into(),
        )));
    }

    repo.delete(category_id).await?;

    Ok(StatusCode::NO_CONTENT)
}
