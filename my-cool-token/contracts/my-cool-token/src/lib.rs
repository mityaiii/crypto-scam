#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AmountMustBePositive = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    Overflow = 6,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Owner,
    Name,
    Symbol,
    Decimals,
    TotalSupply,
    Balance(Address),
    Allowance(AllowanceKey),
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub owner: Address,
    pub spender: Address,
}

#[contract]
pub struct MyCoolToken;

fn require_initialized(env: &Env) {
    if !env.storage().instance().has(&DataKey::Owner) {
        panic_with_error!(env, TokenError::NotInitialized);
    }
}

fn require_positive(env: &Env, amount: i128) {
    if amount <= 0 {
        panic_with_error!(env, TokenError::AmountMustBePositive);
    }
}

fn checked_add(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_add(b)
        .unwrap_or_else(|| panic_with_error!(env, TokenError::Overflow))
}

fn checked_sub(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_sub(b)
        .unwrap_or_else(|| panic_with_error!(env, TokenError::Overflow))
}

fn read_balance(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Balance(addr.clone()))
        .unwrap_or(0_i128)
}

fn write_balance(env: &Env, addr: &Address, amount: i128) {
    env.storage()
        .instance()
        .set(&DataKey::Balance(addr.clone()), &amount);
}

fn read_allowance(env: &Env, owner: &Address, spender: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Allowance(AllowanceKey {
            owner: owner.clone(),
            spender: spender.clone(),
        }))
        .unwrap_or(0_i128)
}

fn write_allowance(env: &Env, owner: &Address, spender: &Address, amount: i128) {
    env.storage().instance().set(
        &DataKey::Allowance(AllowanceKey {
            owner: owner.clone(),
            spender: spender.clone(),
        }),
        &amount,
    );
}

fn do_transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
    let from_bal = read_balance(env, from);
    if from_bal < amount {
        panic_with_error!(env, TokenError::InsufficientBalance);
    }
    write_balance(env, from, checked_sub(env, from_bal, amount));

    let to_bal = read_balance(env, to);
    write_balance(env, to, checked_add(env, to_bal, amount));
}

#[contractimpl]
impl MyCoolToken {
    pub fn init(env: Env, owner: Address, name: String, symbol: String, decimals: u32) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic_with_error!(&env, TokenError::AlreadyInitialized);
        }
        owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);
    }

    pub fn owner(env: Env) -> Address {
        require_initialized(&env);
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }

    pub fn name(env: Env) -> String {
        require_initialized(&env);
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        require_initialized(&env);
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        require_initialized(&env);
        env.storage().instance().get(&DataKey::Decimals).unwrap()
    }

    pub fn total_supply(env: Env) -> i128 {
        require_initialized(&env);
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0_i128)
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        require_initialized(&env);
        read_balance(&env, &id)
    }

    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        require_initialized(&env);
        read_allowance(&env, &owner, &spender)
    }

    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128) {
        require_initialized(&env);

        if amount < 0 {
            panic_with_error!(&env, TokenError::AmountMustBePositive);
        }

        owner.require_auth();
        write_allowance(&env, &owner, &spender, amount);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        require_initialized(&env);
        require_positive(&env, amount);

        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        let cur = read_balance(&env, &to);
        write_balance(&env, &to, checked_add(&env, cur, amount));

        let ts = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0_i128);

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &checked_add(&env, ts, amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        require_initialized(&env);
        require_positive(&env, amount);
        from.require_auth();

        do_transfer(&env, &from, &to, amount);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        require_initialized(&env);
        require_positive(&env, amount);
        spender.require_auth();

        let allowed = read_allowance(&env, &from, &spender);
        if allowed < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }

        write_allowance(&env, &from, &spender, checked_sub(&env, allowed, amount));

        do_transfer(&env, &from, &to, amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        require_initialized(&env);
        require_positive(&env, amount);
        from.require_auth();

        let balance = read_balance(&env, &from);
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        write_balance(&env, &from, checked_sub(&env, balance, amount));

        let ts = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0_i128);

        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &checked_sub(&env, ts, amount));
    }
}
