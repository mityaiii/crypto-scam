use soroban_sdk::{panic_with_error, Env};

use crate::errors::Error;

pub fn require_positive(e: &Env, value: i128) {
    if value <= 0 {
        panic_with_error!(e, Error::InvalidAmount);
    }
}

pub fn checked_add(e: &Env, a: i128, b: i128) -> i128 {
    a.checked_add(b)
        .unwrap_or_else(|| panic_with_error!(e, Error::MathOverflow))
}

pub fn checked_sub(e: &Env, a: i128, b: i128) -> i128 {
    a.checked_sub(b)
        .unwrap_or_else(|| panic_with_error!(e, Error::MathOverflow))
}

pub fn checked_mul(e: &Env, a: i128, b: i128) -> i128 {
    a.checked_mul(b)
        .unwrap_or_else(|| panic_with_error!(e, Error::MathOverflow))
}

pub fn checked_div(e: &Env, a: i128, b: i128) -> i128 {
    if b == 0 {
        panic_with_error!(e, Error::DivisionByZero);
    }

    a.checked_div(b)
        .unwrap_or_else(|| panic_with_error!(e, Error::MathOverflow))
}

pub fn min_i128(a: i128, b: i128) -> i128 {
    if a < b {
        a
    } else {
        b
    }
}

pub fn sqrt_i128(e: &Env, value: i128) -> i128 {
    if value < 0 {
        panic_with_error!(e, Error::InvalidAmount);
    }

    if value == 0 {
        return 0;
    }

    let mut z = value;
    let mut x = value / 2 + 1;

    while x < z {
        z = x;
        x = (value / x + x) / 2;
    }

    z
}

pub fn calc_amount_out(e: &Env, amount_in: i128, reserve_in: i128, reserve_out: i128) -> i128 {
    require_positive(e, amount_in);
    require_positive(e, reserve_in);
    require_positive(e, reserve_out);

    let k = checked_mul(e, reserve_in, reserve_out);
    let new_reserve_in = checked_add(e, reserve_in, amount_in);
    let new_reserve_out = checked_div(e, k, new_reserve_in);
    let amount_out = checked_sub(e, reserve_out, new_reserve_out);

    if amount_out <= 0 {
        panic_with_error!(e, Error::InsufficientLiquidity);
    }

    amount_out
}
