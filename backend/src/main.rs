// #![allow(unused, dead_code)]

#[macro_use]
mod macros;

mod api;
mod config;
mod db;
mod models;
mod util;

use std::{net::SocketAddr, path::PathBuf};

use axum::Router;
use tokio::net::TcpListener;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    util::set_panic_hook();
    util::init_tracing();

    let app = Router::new()
        .nest("/api", api::router().await?)
        .fallback_service(
            ServeDir::new("public").fallback(ServeFile::new(PathBuf::from("public/index.html"))),
        );

    let (addr, listener) = listener().await?;

    util::display_url(&addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn listener() -> std::io::Result<(SocketAddr, TcpListener)> {
    let cfg = config::config();

    let addr = format!("{}:{}", cfg.host, cfg.port)
        .parse::<SocketAddr>()
        .unwrap_or_else(|e| {
            panic!(
                "Failed to parse socket address ({}:{}): {e}",
                cfg.host, cfg.port
            );
        });

    TcpListener::bind(addr)
        .await
        .map(|listener| (addr, listener))
}
