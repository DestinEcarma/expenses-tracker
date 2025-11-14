use serde_json::Value;

#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("record not found: {0}")]
    NotFound(Value),

    #[error("record could not be created for table: {0}")]
    NotCreated(Value),

    #[error("unkown error: {0}")]
    Unknown(Value),

    #[error("{0}")]
    Internal(#[from] Box<surrealdb::Error>),
}

impl From<surrealdb::Error> for DbError {
    fn from(e: surrealdb::Error) -> Self {
        Self::Internal(Box::new(e))
    }
}
