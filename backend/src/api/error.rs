use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Serialize, ser::SerializeStruct};
use serde_json::Value;

use crate::db::DbError;

struct ApiErrorResponse {
    title: &'static str,
    status: StatusCode,
    detail: String,
    error: Option<Value>,
}

impl Serialize for ApiErrorResponse {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("ApiErrorResponse", 4)?;

        state.serialize_field("title", &self.title)?;
        state.serialize_field("status", &self.status.as_u16())?;
        state.serialize_field("detail", &self.detail)?;

        if let Some(ref error) = self.error {
            state.serialize_field("error", error)?;
        }

        state.end()
    }
}

impl From<ApiError> for ApiErrorResponse {
    fn from(e: ApiError) -> Self {
        match e {
            ApiError::Validation(e) => ApiErrorResponse {
                title: "Validation",
                status: StatusCode::BAD_REQUEST,
                detail: "One or more fields failed validation".into(),
                error: Some(e),
            },
            ApiError::Unauthorized(e) => ApiErrorResponse {
                title: "Unauthorized",
                status: StatusCode::UNAUTHORIZED,
                detail: "Authentication required or invalid credentials".into(),
                error: Some(e),
            },
            ApiError::AlreadyExists(e) => ApiErrorResponse {
                title: "Conflict",
                status: StatusCode::CONFLICT,
                detail: "A record with the provided details already exists.".into(),
                error: Some(e),
            },
            ApiError::Db(e) => match e {
                DbError::NotFound(e) => ApiErrorResponse {
                    title: "Record Not Found",
                    status: StatusCode::NOT_FOUND,
                    detail: "The requested resource was not found".into(),
                    error: Some(e),
                },
                DbError::NotCreated(e) => ApiErrorResponse {
                    title: "Not Created",
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    detail: format!("Unable to create record for table: {e}"),
                    error: None,
                },
                DbError::Unknown(_) | DbError::Internal(_) => Self::internal_server_error(),
            },
            ApiError::Jwt(e) => {
                use jsonwebtoken::errors::ErrorKind;

                match e.kind() {
                    ErrorKind::Utf8(_) | ErrorKind::Base64(_) => ApiErrorResponse {
                        title: "Internal Server Error",
                        status: StatusCode::INTERNAL_SERVER_ERROR,
                        detail: "An unexpected error occurred. Please try again later.".into(),
                        error: None,
                    },
                    _ => ApiErrorResponse {
                        title: "Unauthorized",
                        status: StatusCode::UNAUTHORIZED,
                        detail: "Invalid or expired token".into(),
                        error: Some(e.to_string().into()),
                    },
                }
            }
            ApiError::Task(_) | ApiError::PasswordHash(_) => Self::internal_server_error(),
        }
    }
}

impl ApiErrorResponse {
    fn internal_server_error() -> Self {
        Self {
            title: "Internal Server Error",
            status: StatusCode::INTERNAL_SERVER_ERROR,
            detail: "An unexpected error occurred. Please try again later.".into(),
            error: None,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("validation error")]
    Validation(Value),

    #[error("record already exists")]
    AlreadyExists(Value),

    #[error("unauthorized")]
    Unauthorized(Value),

    #[error("database error: {0}")]
    Db(#[from] DbError),

    #[error("jwt error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("task error: {0}")]
    Task(#[from] tokio::task::JoinError),

    #[error("password hashing error: {0}")]
    PasswordHash(#[from] password_hash::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        use tracing::error;

        match &self {
            ApiError::Task(e) => error!("Task error: {e}"),
            ApiError::PasswordHash(e) => error!("Password hashing error: {e}"),
            ApiError::Db(e) => match e {
                DbError::NotCreated(t) => error!("Record not created for table: {t}"),
                _ => error!("Database error: {e}"),
            },
            ApiError::Jwt(e) => {
                use jsonwebtoken::errors::ErrorKind;

                match e.kind() {
                    ErrorKind::Utf8(e) => error!("JWT UTF-8 error: {e}"),
                    ErrorKind::Base64(e) => error!("JWT Base64 error: {e}"),
                    _ => (),
                }
            }
            _ => (),
        }

        let res = ApiErrorResponse::from(self);

        (res.status, Json(res)).into_response()
    }
}
