use soroban_sdk::{contracttype, panic_with_error, Address, Env};

use crate::errors::Error;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    TradeToken,
    XlmToken,
    LpToken,
    ReserveTrade,
    ReserveXlm,
}

pub fn is_initialized(e: &Env) -> bool {
    e.storage().instance().has(&DataKey::TradeToken)
}

pub fn write_trade_token(e: &Env, address: &Address) {
    e.storage().instance().set(&DataKey::TradeToken, address);
}

pub fn read_trade_token(e: &Env) -> Address {
    e.storage()
        .instance()
        .get(&DataKey::TradeToken)
        .unwrap_or_else(|| panic_with_error!(e, Error::NotInitialized))
}

pub fn write_xlm_token(e: &Env, address: &Address) {
    e.storage().instance().set(&DataKey::XlmToken, address);
}

pub fn read_xlm_token(e: &Env) -> Address {
    e.storage()
        .instance()
        .get(&DataKey::XlmToken)
        .unwrap_or_else(|| panic_with_error!(e, Error::NotInitialized))
}

pub fn write_lp_token(e: &Env, address: &Address) {
    e.storage().instance().set(&DataKey::LpToken, address);
}

pub fn read_lp_token(e: &Env) -> Address {
    e.storage()
        .instance()
        .get(&DataKey::LpToken)
        .unwrap_or_else(|| panic_with_error!(e, Error::NotInitialized))
}

pub fn write_reserve_trade(e: &Env, value: i128) {
    e.storage().instance().set(&DataKey::ReserveTrade, &value);
}

pub fn read_reserve_trade(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get(&DataKey::ReserveTrade)
        .unwrap_or(0)
}

pub fn write_reserve_xlm(e: &Env, value: i128) {
    e.storage().instance().set(&DataKey::ReserveXlm, &value);
}

pub fn read_reserve_xlm(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get(&DataKey::ReserveXlm)
        .unwrap_or(0)
}
