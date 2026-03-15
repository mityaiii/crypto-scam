#![no_std]

mod errors;
mod events;
mod metadata;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, panic_with_error, token::TokenInterface, Address, Env, MuxedAddress,
    String,
};

use crate::{
    errors::Error,
    events::{publish_approve, publish_burn, publish_mint, publish_transfer},
    metadata::{read_decimal, read_name, read_symbol, write_metadata},
    storage::{
        has_admin, read_admin, read_allowance, read_balance, read_supply, receive_balance,
        spend_allowance, spend_balance, write_admin, write_allowance, write_supply,
    },
};

#[contract]
pub struct MyCoolToken;

fn check_nonnegative_amount(e: &Env, amount: i128) {
    if amount < 0 {
        panic_with_error!(e, Error::NegativeAmount);
    }
}

#[contractimpl]
impl MyCoolToken {
    pub fn init(e: Env, admin: Address, decimal: u32, name: String, symbol: String) {
        if has_admin(&e) {
            panic_with_error!(&e, Error::AlreadyInitialized);
        }

        if decimal > 18 {
            panic_with_error!(&e, Error::DecimalTooLarge);
        }

        write_admin(&e, &admin);
        write_supply(&e, 0);
        write_metadata(&e, decimal, name, symbol);
    }

    pub fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(&e, amount);

        let admin = read_admin(&e);
        admin.require_auth();

        receive_balance(&e, &to, amount);
        write_supply(&e, read_supply(&e) + amount);

        publish_mint(&e, to, amount);
    }

    pub fn total_supply(e: Env) -> i128 {
        read_supply(&e)
    }

    pub fn admin(e: Env) -> Address {
        read_admin(&e)
    }
}

#[contractimpl]
impl TokenInterface for MyCoolToken {
    fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        read_allowance(&e, &from, &spender)
    }

    fn approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        check_nonnegative_amount(&e, amount);

        write_allowance(&e, &from, &spender, amount, expiration_ledger);
        publish_approve(&e, from, spender, amount, expiration_ledger);
    }

    fn balance(e: Env, id: Address) -> i128 {
        read_balance(&e, &id)
    }

    fn transfer(e: Env, from: Address, to: MuxedAddress, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(&e, amount);

        let to_address = to.address();
        let to_muxed_id = to.id();

        spend_balance(&e, &from, amount);
        receive_balance(&e, &to_address, amount);

        publish_transfer(&e, from, to_address, to_muxed_id, amount);
    }

    fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(&e, amount);

        spend_allowance(&e, &from, &spender, amount);
        spend_balance(&e, &from, amount);
        receive_balance(&e, &to, amount);

        publish_transfer(&e, from, to, None, amount);
    }

    fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(&e, amount);

        spend_balance(&e, &from, amount);
        write_supply(&e, read_supply(&e) - amount);

        publish_burn(&e, from, amount);
    }

    fn burn_from(e: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(&e, amount);

        spend_allowance(&e, &from, &spender, amount);
        spend_balance(&e, &from, amount);
        write_supply(&e, read_supply(&e) - amount);

        publish_burn(&e, from, amount);
    }

    fn decimals(e: Env) -> u32 {
        read_decimal(&e)
    }

    fn name(e: Env) -> String {
        read_name(&e)
    }

    fn symbol(e: Env) -> String {
        read_symbol(&e)
    }
}
