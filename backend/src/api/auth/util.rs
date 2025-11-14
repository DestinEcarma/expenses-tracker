use argon2::{Algorithm, Argon2, Params, PasswordHash, PasswordHasher, PasswordVerifier, Version};
use password_hash::{SaltString, rand_core::OsRng};
use zeroize::Zeroize;

const MEM_COST: u32 = 64 * 1024;
const ITERS: u32 = 3;
const LANES: u32 = 1;

fn argon2_config(pepper: Option<&[u8]>) -> Argon2<'_> {
    let params = Params::new(MEM_COST, ITERS, LANES, None).expect("valid params");

    match pepper {
        Some(secret) => {
            Argon2::new_with_secret(secret, Algorithm::Argon2id, Version::V0x13, params)
                .expect("argon2 with secret")
        }
        None => Argon2::new(Algorithm::Argon2id, Version::V0x13, params),
    }
}

pub fn hash_password(
    password: String,
    pepper: &Option<String>,
) -> Result<String, password_hash::Error> {
    let mut pw = password.to_owned();
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = argon2_config(pepper.as_deref().map(str::as_bytes));

    let hash = argon2.hash_password(pw.as_bytes(), &salt)?.to_string();
    pw.zeroize();

    Ok(hash)
}

pub fn verify_password(
    password: String,
    stored_phc: &str,
    pepper: &Option<String>,
) -> Result<bool, password_hash::Error> {
    let parsed = PasswordHash::new(stored_phc)?;
    let argon2 = argon2_config(pepper.as_deref().map(str::as_bytes));

    Ok(argon2.verify_password(password.as_bytes(), &parsed).is_ok())
}

#[allow(dead_code)]
pub fn needs_rehash(stored_phc: &str, target: &Params) -> bool {
    let Ok(ph) = PasswordHash::new(stored_phc) else {
        return true;
    };

    let m = ph.params.get("m").and_then(|v| v.decimal().ok());
    let t = ph.params.get("t").and_then(|v| v.decimal().ok());
    let p = ph.params.get("p").and_then(|v| v.decimal().ok());

    m != Some(target.m_cost()) || t != Some(target.t_cost()) || p != Some(target.p_cost())
}
