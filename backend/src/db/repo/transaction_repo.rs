use surrealdb::{Datetime, RecordId};

use crate::{
    db::{ApiDb, DbError},
    models::Transaction,
};

pub struct TransactionRepo<'a> {
    db: &'a ApiDb,
}

impl<'a> TransactionRepo<'a> {
    pub fn new(db: &'a ApiDb) -> Self {
        Self { db }
    }

    pub async fn create(
        &self,
        category_id: RecordId,
        amount: f64,
        note: Option<String>,
    ) -> Result<RecordId, DbError> {
        let sql = "fn::add_transation($category, $amount, $note);";

        self.db
            .query(sql)
            .bind(("category", category_id))
            .bind(("amount", amount))
            .bind(("note", note))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::NotCreated("transaction".into()))
    }

    pub async fn list(
        &self,
        category_id: RecordId,
        start: Datetime,
        end: Datetime,
    ) -> Result<Vec<Transaction>, DbError> {
        let sql = r#"
        SELECT
            amount,
            note
        FROM $category<-user_category->category_transaction.out
        WHERE created_at IN $start..=$end
        "#;

        Ok(self
            .db
            .query(sql)
            .bind(("category", category_id))
            .bind(("start", start))
            .bind(("end", end))
            .await?
            .take(0)?)
    }
}
