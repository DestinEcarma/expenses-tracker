use axum::{extract::FromRequestParts, http::request::Parts};
use surrealdb::RecordId;

use crate::api::ApiError;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub user_id: RecordId,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthUser>()
            .cloned()
            .ok_or(ApiError::Unauthorized("Missing Auth Context".into()))
    }
}
