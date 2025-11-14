use crate::db::{ApiDb, DbError};
use email_address::EmailAddress;
use serde_json::json;

pub struct UserRepo<'a> {
    db: &'a ApiDb,
}

impl<'a> UserRepo<'a> {
    pub fn new(db: &'a ApiDb) -> Self {
        Self { db }
    }

    pub async fn exists(
        &self,
        email: EmailAddress,
        username: String,
    ) -> Result<(bool, bool), DbError> {
        let sql = r#"
        (SELECT VALUE id FROM ONLY user WHERE email = $email LIMIT 1) != NONE;
        (SELECT VALUE id FROM ONLY user WHERE username = $username LIMIT 1) != NONE;
        "#;

        let mut res = self
            .db
            .query(sql)
            .bind(("email", email))
            .bind(("username", username))
            .await?;

        let email = res.take::<Option<_>>(0)?.ok_or(DbError::Unknown(
            json!({ "result": "Expected boolean got None" }),
        ))?;

        let username = res.take::<Option<_>>(1)?.ok_or(DbError::Unknown(
            json!({ "result": "Expected boolean got None" }),
        ))?;

        Ok((email, username))
    }

    pub async fn create(
        &self,
        email: EmailAddress,
        username: String,
        password_hash: String,
    ) -> Result<surrealdb::RecordId, DbError> {
        let sql = r#"
        CREATE user SET
            email = $email,
            username = $username,
            password_hash = $password_hash
        RETURN VALUE id;
        "#;

        self.db
            .query(sql)
            .bind(("email", email))
            .bind(("username", username))
            .bind(("password_hash", password_hash))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::NotCreated("user".into()))
    }

    pub async fn get_by_username(
        &self,
        username: String,
    ) -> Result<crate::models::UserAuth, DbError> {
        let sql = r#"
        SELECT
            id,
            username,
            password_hash
        FROM ONLY user
        WHERE username = $username
        LIMIT 1;
        "#;

        self.db
            .query(sql)
            .bind(("username", username))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::NotFound(
                json!({"username": "No user found with that username"}),
            ))
    }
}
