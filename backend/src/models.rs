use serde::{Deserialize, Serialize, Serializer};
use surrealdb::{Datetime, RecordId};

pub fn serialize_record_id<S>(id: &RecordId, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&id.key().to_string())
}

#[derive(Deserialize)]
pub struct UserAuth {
    pub id: RecordId,
    #[allow(dead_code)]
    pub username: String,
    pub password_hash: String,
}

#[derive(Deserialize, Serialize)]
pub struct Category {
    #[serde(serialize_with = "serialize_record_id")]
    pub id: RecordId,
    pub name: String,
    pub icon: String,
    pub amount: f64,
    pub transactions: usize,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    #[serde(serialize_with = "serialize_record_id")]
    pub id: RecordId,
    pub amount: f64,
    pub note: Option<String>,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Deserialize, Serialize)]
pub struct Expense {
    pub date: String,
    pub amount: f64,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpensesOverview {
    pub daily_expense: Vec<Expense>,
    pub categories: Vec<Category>,
}
