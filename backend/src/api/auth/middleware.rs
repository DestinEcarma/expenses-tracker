use std::{str::FromStr, sync::Arc};

use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::decode;
use surrealdb::RecordId;

use crate::{
    api::{
        ApiError, ApiState,
        auth::{extractor::AuthUser, jwt::Claims},
    },
    db::DbError,
};

pub async fn require_auth(
    State(state): State<Arc<ApiState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, ApiError> {
    let auth = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or(ApiError::Unauthorized("MissingAuthorization".into()))?;

    let token = auth
        .strip_prefix("Bearer ")
        .ok_or(ApiError::Unauthorized("InvalidAuthScheme".into()))?;

    let data = decode::<Claims>(token, &state.jwt_verifier.dec, &state.jwt_verifier.val)?;

    if data.claims.scope.as_deref() != Some("access") {
        return Err(ApiError::Unauthorized("InvalidScope".into()));
    }

    req.extensions_mut().insert(AuthUser {
        user_id: RecordId::from_str(&data.claims.sub)
            .map_err(|e| ApiError::Db(DbError::Internal(Box::new(e))))?,
    });

    Ok(next.run(req).await)
}
