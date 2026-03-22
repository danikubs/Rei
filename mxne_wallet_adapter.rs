mod stellar_bridge;

use stellar_bridge::StellarBridge;

pub fn simulate_wallet_flow() {
    let deposit = StellarBridge::deposit_mxne(500.0).expect("deposit must succeed");
    println!(
        "Deposit confirmed: {} | {} {} MXNe on {}",
        deposit.tx_hash, deposit.provider, deposit.amount_mxne, deposit.network
    );

    let withdraw = StellarBridge::withdraw_mxne(200.0).expect("withdraw must succeed");
    println!(
        "Withdraw confirmed: {} | {} {} MXNe on {}",
        withdraw.tx_hash, withdraw.provider, withdraw.amount_mxne, withdraw.network
    );
}
