use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
pub struct StellarTxResult {
    pub tx_hash: String,
    pub provider: String,
    pub network: String,
    pub amount_mxne: f64,
}

pub struct StellarBridge;

impl StellarBridge {
    pub fn deposit_mxne(amount_mxne: f64) -> Result<StellarTxResult, String> {
        if amount_mxne <= 0.0 {
            return Err("Invalid amount for deposit".to_string());
        }

        Ok(StellarTxResult {
            tx_hash: format!("dep_{:x}", now_ms()),
            provider: "Etherfuse".to_string(),
            network: "Stellar".to_string(),
            amount_mxne,
        })
    }

    pub fn withdraw_mxne(amount_mxne: f64) -> Result<StellarTxResult, String> {
        if amount_mxne <= 0.0 {
            return Err("Invalid amount for withdrawal".to_string());
        }

        Ok(StellarTxResult {
            tx_hash: format!("wdr_{:x}", now_ms()),
            provider: "Etherfuse".to_string(),
            network: "Stellar".to_string(),
            amount_mxne,
        })
    }
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}
