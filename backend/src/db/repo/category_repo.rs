use serde_json::json;
use surrealdb::{Datetime, RecordId};

use crate::{
    db::{ApiDb, DbError},
    models::{Category, Expense, ExpensesOverview},
};

pub struct CategoryRepo<'a> {
    db: &'a ApiDb,
}

impl<'a> CategoryRepo<'a> {
    pub fn new(db: &'a ApiDb) -> Self {
        Self { db }
    }

    pub async fn exists(&self, user_id: RecordId, name: String) -> Result<bool, DbError> {
        let sql = r#"
        (
            SELECT VALUE id
            FROM ONLY $user->user_category.out
            WHERE string::lowercase(name) = string::lowercase($name)
            LIMIT 1
        ) != NONE;
        "#;

        self.db
            .query(sql)
            .bind(("user", user_id))
            .bind(("name", name))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::Unknown(json!({
                "result": "Expected boolean got None"
            })))
    }

    pub async fn exists_excluding(
        &self,
        user_id: RecordId,
        name: String,
        exclude_id: RecordId,
    ) -> Result<bool, DbError> {
        let sql = r#"
        (
            SELECT VALUE id
            FROM ONLY $user->user_category.out
            WHERE
                string::lowercase(name) = string::lowercase($name)
                AND id != $exclude
            LIMIT 1
        ) != NONE;
        "#;

        self.db
            .query(sql)
            .bind(("user", user_id))
            .bind(("name", name))
            .bind(("exclude", exclude_id))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::Unknown(json!({
                "result": "Expected boolean got None"
            })))
    }

    pub async fn user_owns(
        &self,
        user_id: RecordId,
        category_id: RecordId,
    ) -> Result<bool, DbError> {
        let sql = r#"
        (
            SELECT VALUE id
            FROM ONLY $user->user_category
            WHERE out = $category
            LIMIT 1
        ) != NONE;
        "#;

        self.db
            .query(sql)
            .bind(("user", user_id))
            .bind(("category", category_id))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::Unknown(json!({
                "result": "Expected boolean got None"
            })))
    }

    pub async fn create(
        &self,
        user_id: RecordId,
        name: String,
        icon: String,
    ) -> Result<RecordId, DbError> {
        let sql = "fn::add_category($user, $name, $icon);";

        self.db
            .query(sql)
            .bind(("user", user_id))
            .bind(("name", name))
            .bind(("icon", icon))
            .await?
            .take::<Option<_>>(0)?
            .ok_or(DbError::NotCreated("category".into()))
    }

    pub async fn edit(&self, id: RecordId, name: String, icon: String) -> Result<(), DbError> {
        let sql = "UPDATE ONLY $category SET name = $name, icon = $icon;";

        self.db
            .query(sql)
            .bind(("category", id))
            .bind(("name", name))
            .bind(("icon", icon))
            .await?;

        Ok(())
    }

    pub async fn delete(&self, category_id: RecordId) -> Result<(), DbError> {
        let sql = r#"
        DELETE (SELECT VALUE id FROM $category<-user_category->category_transaction);
        DELETE ONLY $category RETURN BEFORE;
        "#;

        self.db.query(sql).bind(("category", category_id)).await?;

        Ok(())
    }

    pub async fn get_expenses_overview(
        &self,
        user_id: RecordId,
        start: Datetime,
        end: Datetime,
    ) -> Result<ExpensesOverview, DbError> {
        let sql = r#"
        SELECT
            time::format(date, "%Y-%m-%d") AS date,
            math::sum(amount) AS amount
        FROM $user->user_category->category_transaction.out
        WHERE created_at IN $start..=$end
        GROUP BY date
        ORDER BY date NUMERIC;
        SELECT
            *,
            count(raw_transactions) AS transactions,
            math::sum(raw_transactions) AS amount
        OMIT raw_transactions
        FROM (
            SELECT
                id,
                name,
                icon,
                (
                    SELECT VALUE amount
                    FROM <-user_category->category_transaction.out
                    WHERE date IN $start..=$end
                ) AS raw_transactions
            FROM $user->user_category.out
        );
        "#;

        let mut res = self
            .db
            .query(sql)
            .bind(("user", user_id))
            .bind(("start", start))
            .bind(("end", end))
            .await?;

        Ok(ExpensesOverview {
            daily_expense: res.take::<Vec<Expense>>(0)?,
            categories: res.take::<Vec<Category>>(1)?,
        })
    }
}
