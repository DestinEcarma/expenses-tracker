pub mod error;
pub mod repo;

pub use error::DbError;
use surrealdb::engine::any;

pub type ApiDb = surrealdb::Surreal<any::Any>;

pub async fn init_db() -> Result<ApiDb, DbError> {
    let cfg = &crate::config::config().surreal;

    let db = any::connect(&cfg.url).await?;

    db.signin(surrealdb::opt::auth::Root {
        username: &cfg.user,
        password: &cfg.pass,
    })
    .await?;

    db.use_ns(&cfg.ns).use_db(&cfg.db).await?;

    tracing::info!(
        "Connected to SurrealDB at {}, using {}/{}",
        cfg.url,
        cfg.ns,
        cfg.db
    );

    Ok(db)
}
