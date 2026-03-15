#![no_std]

mod errors;
mod events;
mod math;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractclient, contractimpl, panic_with_error, token, Address, Env};

use crate::{
    errors::Error,
    events::{
        publish_add_liquidity, publish_remove_liquidity, publish_swap_token_for_xlm,
        publish_swap_xlm_for_token,
    },
    math::{
        calc_amount_out, checked_add, checked_div, checked_mul, checked_sub, min_i128,
        require_positive, sqrt_i128,
    },
    storage::{
        is_initialized, read_lp_token, read_reserve_trade, read_reserve_xlm, read_trade_token,
        read_xlm_token, write_lp_token, write_reserve_trade, write_reserve_xlm, write_trade_token,
        write_xlm_token,
    },
};

#[contractclient(name = "LpTokenAdminClient")]
pub trait LpTokenAdminInterface {
    fn mint(e: Env, to: Address, amount: i128);
    fn total_supply(e: Env) -> i128;
    fn burn(e: Env, from: Address, amount: i128);
}

#[contract]
pub struct LiquidityPool;

fn trade_client(e: &Env) -> token::TokenClient<'_> {
    token::TokenClient::new(e, &read_trade_token(e))
}

fn xlm_client(e: &Env) -> token::TokenClient<'_> {
    token::TokenClient::new(e, &read_xlm_token(e))
}

fn lp_admin_client(e: &Env) -> LpTokenAdminClient<'_> {
    LpTokenAdminClient::new(e, &read_lp_token(e))
}

#[contractimpl]
impl LiquidityPool {
    pub fn init(e: Env, trade_token: Address, xlm_token: Address, lp_token: Address) {
        if is_initialized(&e) {
            panic_with_error!(&e, Error::AlreadyInitialized);
        }

        write_trade_token(&e, &trade_token);
        write_xlm_token(&e, &xlm_token);
        write_lp_token(&e, &lp_token);
        write_reserve_trade(&e, 0);
        write_reserve_xlm(&e, 0);
    }

    pub fn get_reserves(e: Env) -> (i128, i128) {
        (read_reserve_trade(&e), read_reserve_xlm(&e))
    }

    pub fn quote_token_for_xlm(e: Env, trade_in: i128) -> i128 {
        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);

        if reserve_trade <= 0 || reserve_xlm <= 0 {
            panic_with_error!(&e, Error::PoolEmpty);
        }

        calc_amount_out(&e, trade_in, reserve_trade, reserve_xlm)
    }

    pub fn quote_xlm_for_token(e: Env, xlm_in: i128) -> i128 {
        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);

        if reserve_trade <= 0 || reserve_xlm <= 0 {
            panic_with_error!(&e, Error::PoolEmpty);
        }

        calc_amount_out(&e, xlm_in, reserve_xlm, reserve_trade)
    }

    pub fn add_liquidity(
        e: Env,
        provider: Address,
        trade_amount: i128,
        xlm_amount: i128,
        min_lp_out: i128,
    ) -> i128 {
        provider.require_auth();
        require_positive(&e, trade_amount);
        require_positive(&e, xlm_amount);

        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);
        let lp_client = lp_admin_client(&e);
        let total_lp = lp_client.total_supply();

        let lp_out = if total_lp == 0 {
            let product = checked_mul(&e, trade_amount, xlm_amount);
            sqrt_i128(&e, product)
        } else {
            if reserve_trade <= 0 || reserve_xlm <= 0 {
                panic_with_error!(&e, Error::PoolEmpty);
            }

            let left = checked_mul(&e, trade_amount, reserve_xlm);
            let right = checked_mul(&e, xlm_amount, reserve_trade);

            if left != right {
                panic_with_error!(&e, Error::InvalidRatio);
            }

            let from_trade =
                checked_div(&e, checked_mul(&e, trade_amount, total_lp), reserve_trade);
            let from_xlm = checked_div(&e, checked_mul(&e, xlm_amount, total_lp), reserve_xlm);
            min_i128(from_trade, from_xlm)
        };

        if lp_out < min_lp_out || lp_out <= 0 {
            panic_with_error!(&e, Error::SlippageExceeded);
        }

        let current = e.current_contract_address();

        trade_client(&e).transfer(&provider, &current, &trade_amount);
        xlm_client(&e).transfer(&provider, &current, &xlm_amount);
        lp_client.mint(&provider, &lp_out);

        write_reserve_trade(&e, checked_add(&e, reserve_trade, trade_amount));
        write_reserve_xlm(&e, checked_add(&e, reserve_xlm, xlm_amount));

        publish_add_liquidity(&e, &provider, trade_amount, xlm_amount, lp_out);

        lp_out
    }

    pub fn remove_liquidity(
        e: Env,
        provider: Address,
        lp_amount: i128,
        min_trade_out: i128,
        min_xlm_out: i128,
    ) -> (i128, i128) {
        provider.require_auth();
        require_positive(&e, lp_amount);

        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);

        if reserve_trade <= 0 || reserve_xlm <= 0 {
            panic_with_error!(&e, Error::PoolEmpty);
        }

        let lp_client = lp_admin_client(&e);
        let total_lp = lp_client.total_supply();
        if total_lp <= 0 {
            panic_with_error!(&e, Error::InsufficientLiquidity);
        }

        let trade_out = checked_div(&e, checked_mul(&e, lp_amount, reserve_trade), total_lp);
        let xlm_out = checked_div(&e, checked_mul(&e, lp_amount, reserve_xlm), total_lp);

        if trade_out < min_trade_out || xlm_out < min_xlm_out {
            panic_with_error!(&e, Error::SlippageExceeded);
        }

        let current = e.current_contract_address();

        lp_client.burn(&provider, &lp_amount);
        trade_client(&e).transfer(&current, &provider, &trade_out);
        xlm_client(&e).transfer(&current, &provider, &xlm_out);

        write_reserve_trade(&e, checked_sub(&e, reserve_trade, trade_out));
        write_reserve_xlm(&e, checked_sub(&e, reserve_xlm, xlm_out));

        publish_remove_liquidity(&e, &provider, lp_amount, trade_out, xlm_out);

        (trade_out, xlm_out)
    }

    pub fn swap_token_for_xlm(e: Env, user: Address, trade_in: i128, min_xlm_out: i128) -> i128 {
        user.require_auth();
        require_positive(&e, trade_in);

        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);

        if reserve_trade <= 0 || reserve_xlm <= 0 {
            panic_with_error!(&e, Error::PoolEmpty);
        }

        let xlm_out = calc_amount_out(&e, trade_in, reserve_trade, reserve_xlm);

        if xlm_out < min_xlm_out {
            panic_with_error!(&e, Error::SlippageExceeded);
        }

        let current = e.current_contract_address();

        trade_client(&e).transfer(&user, &current, &trade_in);
        xlm_client(&e).transfer(&current, &user, &xlm_out);

        write_reserve_trade(&e, checked_add(&e, reserve_trade, trade_in));
        write_reserve_xlm(&e, checked_sub(&e, reserve_xlm, xlm_out));

        publish_swap_token_for_xlm(&e, &user, trade_in, xlm_out);

        xlm_out
    }

    pub fn swap_xlm_for_token(e: Env, user: Address, xlm_in: i128, min_trade_out: i128) -> i128 {
        user.require_auth();
        require_positive(&e, xlm_in);

        let reserve_trade = read_reserve_trade(&e);
        let reserve_xlm = read_reserve_xlm(&e);

        if reserve_trade <= 0 || reserve_xlm <= 0 {
            panic_with_error!(&e, Error::PoolEmpty);
        }

        let trade_out = calc_amount_out(&e, xlm_in, reserve_xlm, reserve_trade);

        if trade_out < min_trade_out {
            panic_with_error!(&e, Error::SlippageExceeded);
        }

        let current = e.current_contract_address();

        xlm_client(&e).transfer(&user, &current, &xlm_in);
        trade_client(&e).transfer(&current, &user, &trade_out);

        write_reserve_xlm(&e, checked_add(&e, reserve_xlm, xlm_in));
        write_reserve_trade(&e, checked_sub(&e, reserve_trade, trade_out));

        publish_swap_xlm_for_token(&e, &user, xlm_in, trade_out);

        trade_out
    }
}
