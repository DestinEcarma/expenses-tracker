use std::{env, sync::OnceLock};

static CONFIG: OnceLock<Config> = OnceLock::new();

#[derive(Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    pub pepper: Option<String>,

    pub surreal: SurrealConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug)]
pub struct SurrealConfig {
    pub user: String,
    pub pass: String,
    pub url: String,
    pub ns: String,
    pub db: String,
}

#[derive(Debug)]
pub struct JwtConfig {
    pub secret: String,
    pub iss: String,
    pub access_ttl: u64,
    pub refresh_ttl: u64,
}

#[inline]
pub fn config() -> &'static Config {
    CONFIG.get_or_init(|| {
        let host = env_default!("HOST" = "127.0.0.1");
        let port = env_default!("PORT" as u16 = 8080);

        let pepper = env::var("PEPPER").ok();

        let surreal_user = env_default!("SURREAL_USER" = "root");
        let surreal_pass = env_default!("SURREAL_PASS" = "root");
        let surreal_url = env_default!("SURREAL_URL" = "ws://localhost:8000");
        let surreal_ns = env_default!("SURREAL_NS" = "dev");
        let surreal_db = env_default!("SURREAL_DB" = "dev");

        let jwt_secret = env_default!("JWT_SECRET" = "pwease_change_me");
        let jwt_iss = env_default!("JWT_ISS" = "dev");
        let jwt_access_ttl = env_default!("JWT_ACCESS_TTL" as u64 = 900);
        let jwt_refresh_ttl = env_default!("JWT_REFRESH_TTL" as u64 = 604800);

        if !(surreal_url.starts_with("ws://")
            || surreal_url.starts_with("wss://")
            || surreal_url.starts_with("http://")
            || surreal_url.starts_with("https://")
            || surreal_url.starts_with("file://")
            || surreal_url.starts_with("rocksdb://")
            || surreal_url.starts_with("tikv://"))
        {
            panic!("SURREAL_URL must start with ws://, wss://, http://, https://, file://, rocksdb://, or tikv:// (got {surreal_url})");
        }

        Config {
            host,
            port,

            pepper,

            surreal: SurrealConfig {
                user: surreal_user,
                pass: surreal_pass,
                url: surreal_url,
                ns: surreal_ns,
                db: surreal_db,
            },

            jwt: JwtConfig {
                secret: jwt_secret,
                iss: jwt_iss,
                access_ttl: jwt_access_ttl,
                refresh_ttl: jwt_refresh_ttl,
            },
        }
    })
}
