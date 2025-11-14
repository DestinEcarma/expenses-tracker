use chrono::Utc;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, encode};
use serde::{Deserialize, Serialize};

use crate::{api::ApiError, config::config};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub exp: i64,
    pub iat: i64,
    pub iss: String,
    pub scope: Option<String>,
}

pub struct JwtKeys {
    pub enc: EncodingKey,
    pub iss: &'static str,
    pub access_ttl: i64,
    pub refresh_ttl: i64,
}

impl JwtKeys {
    pub fn new_from_env() -> Self {
        let cfg = &config().jwt;

        Self {
            enc: EncodingKey::from_secret(cfg.secret.as_bytes()),
            iss: &cfg.iss,
            access_ttl: cfg.access_ttl as i64,
            refresh_ttl: cfg.refresh_ttl as i64,
        }
    }

    pub fn mk_access(&self, user_id: &str) -> Result<(String, i64), ApiError> {
        let now = Utc::now().timestamp();
        let exp = now + self.access_ttl;
        let claims = Claims {
            sub: user_id.into(),
            iat: now,
            exp,
            iss: self.iss.into(),
            scope: Some("access".into()),
        };

        Ok((encode(&Header::default(), &claims, &self.enc)?, exp))
    }

    pub fn mk_refresh(&self, user_id: &str) -> Result<String, ApiError> {
        let now = Utc::now().timestamp();
        let claims = Claims {
            sub: user_id.into(),
            iat: now,
            exp: now + self.refresh_ttl,
            iss: self.iss.into(),
            scope: Some("refresh".into()),
        };

        Ok(encode(&Header::default(), &claims, &self.enc)?)
    }
}

pub struct JwtVerifier {
    pub dec: DecodingKey,
    pub val: Validation,
}

impl JwtVerifier {
    pub fn hs256_from_env() -> Self {
        let cfg = &config().jwt;

        let secret = cfg.secret.as_bytes();
        let mut val = Validation::new(Algorithm::HS256);

        val.set_issuer(&[&cfg.iss]);

        Self {
            dec: DecodingKey::from_secret(secret),
            val,
        }
    }
}
