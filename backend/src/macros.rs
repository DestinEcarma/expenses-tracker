#[macro_export]
macro_rules! env_default {
    ($key:literal = $default:expr) => {{
        match std::env::var($key) {
            Ok(v) if !v.is_empty() => v,
            Ok(_) | Err(_) => {
                tracing::warn!(concat!($key, " not set, defaulting to ({})"), $default);
                $default.into()
            }
        }
    }};

    ($key:literal as $ty:ty = $default:expr) => {{
        match std::env::var($key) {
            Ok(s) if !s.is_empty() => match s.parse::<$ty>() {
                Ok(v) => v,
                Err(_) => {
                    tracing::warn!(
                        concat!($key, " not set or invalid, defaulting to ({})"),
                        $default
                    );
                    $default
                }
            },
            _ => {
                tracing::warn!(
                    concat!($key, " not set or invalid, defaulting to ({})"),
                    $default
                );
                $default
            }
        }
    }};
}
