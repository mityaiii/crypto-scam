use soroban_sdk::{contracttype, panic_with_error, Address, Env};

use crate::errors::Error;

#[derive(Clone)]
#[contracttype]
pub struct AllowanceDataKey {
    pub from: Address,
    pub spender: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Supply,
    Balance(Address),
    Allowance(AllowanceDataKey),
}

pub fn has_admin(e: &Env) -> bool {
    e.storage().instance().has(&DataKey::Admin)
}

pub fn read_admin(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn write_admin(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_supply(e: &Env) -> i128 {
    e.storage().instance().get(&DataKey::Supply).unwrap_or(0)
}

pub fn write_supply(e: &Env, supply: i128) {
    e.storage().instance().set(&DataKey::Supply, &supply);
}

fn balance_key(id: &Address) -> DataKey {
    DataKey::Balance(id.clone())
}

pub fn read_balance(e: &Env, id: &Address) -> i128 {
    e.storage().persistent().get(&balance_key(id)).unwrap_or(0)
}

fn write_balance(e: &Env, id: &Address, amount: i128) {
    let key = balance_key(id);

    if amount == 0 {
        e.storage().persistent().remove(&key);
    } else {
        e.storage().persistent().set(&key, &amount);
    }
}

pub fn receive_balance(e: &Env, id: &Address, amount: i128) {
    let current = read_balance(e, id);
    write_balance(e, id, current + amount);
}

pub fn spend_balance(e: &Env, id: &Address, amount: i128) {
    let current = read_balance(e, id);
    if current < amount {
        panic_with_error!(e, Error::InsufficientBalance);
    }

    write_balance(e, id, current - amount);
}

fn allowance_key(from: &Address, spender: &Address) -> DataKey {
    DataKey::Allowance(AllowanceDataKey {
        from: from.clone(),
        spender: spender.clone(),
    })
}

fn read_allowance_value(e: &Env, from: &Address, spender: &Address) -> Option<AllowanceValue> {
    let key = allowance_key(from, spender);

    let value: Option<AllowanceValue> = e.storage().persistent().get(&key);
    match value {
        Some(v) if v.expiration_ledger >= e.ledger().sequence() => Some(v),
        _ => None,
    }
}

pub fn read_allowance(e: &Env, from: &Address, spender: &Address) -> i128 {
    read_allowance_value(e, from, spender)
        .map(|v| v.amount)
        .unwrap_or(0)
}

pub fn write_allowance(
    e: &Env,
    from: &Address,
    spender: &Address,
    amount: i128,
    expiration_ledger: u32,
) {
    let key = allowance_key(from, spender);

    if amount == 0 {
        e.storage().persistent().remove(&key);
        return;
    }

    if expiration_ledger < e.ledger().sequence() {
        panic_with_error!(e, Error::InvalidExpirationLedger);
    }

    let value = AllowanceValue {
        amount,
        expiration_ledger,
    };

    e.storage().persistent().set(&key, &value);
}

pub fn spend_allowance(e: &Env, from: &Address, spender: &Address, amount: i128) {
    let current = read_allowance_value(e, from, spender)
        .unwrap_or_else(|| panic_with_error!(e, Error::InsufficientAllowance));

    if current.amount < amount {
        panic_with_error!(e, Error::InsufficientAllowance);
    }

    let remaining = current.amount - amount;
    let key = allowance_key(from, spender);

    if remaining == 0 {
        e.storage().persistent().remove(&key);
    } else {
        let updated = AllowanceValue {
            amount: remaining,
            expiration_ledger: current.expiration_ledger,
        };

        e.storage().persistent().set(&key, &updated);
    }
}
