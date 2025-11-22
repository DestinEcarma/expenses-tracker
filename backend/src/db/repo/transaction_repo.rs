use serde_json::json;
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

    pub async fn user_owns(
        &self,
        user_id: RecordId,
        transaction_id: RecordId,
    ) -> Result<bool, DbError> {
        let sql = r#"
        (
            SELECT VALUE id
            FROM ONLY $user->user_category->category_transaction.out
            WHERE id = $transaction
            LIMIT 1
        ) != NONE;
        "#;

        self.db
            .query(sql)
            .bind(("user", user_id))
            .bind(("transaction", transaction_id))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::Unknown(json!({
                "result": "Expected boolean got None"
            })))
    }

    pub async fn create(
        &self,
        category_id: RecordId,
        amount: f64,
        note: Option<String>,
        date: Datetime,
    ) -> Result<RecordId, DbError> {
        let sql = "fn::add_transation($category, $amount, $note, $date);";

        self.db
            .query(sql)
            .bind(("category", category_id))
            .bind(("amount", amount))
            .bind(("note", note))
            .bind(("date", date))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::NotCreated("transaction".into()))
    }

    pub async fn edit(
        &self,
        id: RecordId,
        amount: f64,
        note: Option<String>,
        date: Datetime,
    ) -> Result<(), DbError> {
        let sql = "UPDATE ONLY $transaction SET amount = $amount, note = $note, date = $date;";

        self.db
            .query(sql)
            .bind(("transaction", id))
            .bind(("amount", amount))
            .bind(("note", note))
            .bind(("date", date))
            .await?;

        Ok(())
    }

    pub async fn delete(&self, id: RecordId) -> Result<(), DbError> {
        let sql = "DELETE ONLY $transaction RETURN BEFORE;";

        self.db.query(sql).bind(("transaction", id)).await?;

        Ok(())
    }

    pub async fn list(
        &self,
        category_id: RecordId,
        start: Datetime,
        end: Datetime,
    ) -> Result<Vec<Transaction>, DbError> {
        let sql = r#"
        SELECT
            id,
            amount,
            note,
            date
        FROM $category<-user_category->category_transaction.out
        WHERE date IN $start..=$end
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
