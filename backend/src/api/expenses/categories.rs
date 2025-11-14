use std::sync::Arc;

use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::Deserialize;
use serde_json::json;

use crate::{
    api::{ApiError, ApiState, auth::extractor::AuthUser},
    db::repo::CategoryRepo,
    models::Category,
};

#[derive(Deserialize)]
pub struct CreateItemPayload {
    name: String,
    icon: String,
}

pub async fn create(
    State(state): State<Arc<ApiState>>,
    auth: AuthUser,
    Json(payload): Json<CreateItemPayload>,
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
