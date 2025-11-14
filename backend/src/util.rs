pub fn set_panic_hook() {
    std::panic::set_hook(Box::new(|panic_info| {
        use tracing::error;

        let location = panic_info
            .location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_else(|| "unknown location".to_string());

        if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            error!("panic occurred at {location}:");
            error!("{s}");
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            error!("panic occurred at {location}:");
            error!("{s}");
        } else {
            error!("panic occurred at {location}:");
            error!("(non-string payload)");
        }
    }));
}

pub fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with_writer(std::io::stderr)
        .with_ansi(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(false)
        .init();
}

pub fn display_url(addr: &std::net::SocketAddr) {
    use tracing::info;

    if addr.ip().is_unspecified()
        && let Ok(ifaces) = get_if_addrs::get_if_addrs()
        && !ifaces.is_empty()
    {
        let urls = ifaces
            .iter()
            .filter(|iface| !iface.is_loopback() && iface.ip().is_ipv4())
            .map(|iface| format!("http://{}:{}", iface.ip(), addr.port()))
            .collect::<Vec<_>>()
            .join(" ");

        info!("Server running on {urls}");

        return;
    }

    info!("Server running on http://{addr}")
}
