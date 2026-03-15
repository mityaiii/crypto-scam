use soroban_sdk::{Address, Env, U256};
use soroban_token_sdk::events as token_events;

pub fn publish_mint(e: &Env, to: Address, amount: i128) {
    token_events::MintWithAmountOnly { to, amount }.publish(e);
}

pub fn publish_burn(e: &Env, from: Address, amount: i128) {
    token_events::Burn { from, amount }.publish(e);
}

pub fn publish_transfer(
    e: &Env,
    from: Address,
    to: Address,
    to_muxed_id: Option<U256>,
    amount: i128,
) {
    token_events::Transfer {
        from,
        to,
        to_muxed_id,
        amount,
    }
    .publish(e);
}

pub fn publish_approve(
    e: &Env,
    from: Address,
    spender: Address,
    amount: i128,
    expiration_ledger: u32,
) {
    token_events::Approve {
        from,
        spender,
        amount,
        expiration_ledger,
    }
    .publish(e);
}
