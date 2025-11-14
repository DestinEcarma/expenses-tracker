use std::sync::Arc;

use axum::{
    Json,
    extract::{Query, State},
    response::IntoResponse,
};

use crate::{
    api::{ApiError, ApiState, auth::extractor::AuthUser, defs::DateRange},
    db::repo::CategoryRepo,
};

pub async fn get_expenses_overview(
    State(state): State<Arc<ApiState>>,
    auth: AuthUser,
    Query(range): Query<DateRange>,
) -> Result<impl IntoResponse, ApiError> {
    let repo = CategoryRepo::new(&state.db);

    let expenses = repo
        .get_expenses_overview(auth.user_id, range.start, range.end)
        .await?;

    Ok(Json(expenses))
}
