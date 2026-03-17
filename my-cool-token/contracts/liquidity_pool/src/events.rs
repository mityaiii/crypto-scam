use soroban_sdk::{symbol_short, Address, Env};

pub fn publish_add_liquidity(
    e: &Env,
    provider: &Address,
    trade_amount: i128,
    xlm_amount: i128,
    lp_out: i128,
) {
    e.events().publish(
        (symbol_short!("add"), provider.clone()),
        (trade_amount, xlm_amount, lp_out),
    );
}

pub fn publish_remove_liquidity(
    e: &Env,
    provider: &Address,
    lp_amount: i128,
    trade_out: i128,
    xlm_out: i128,
) {
    e.events().publish(
        (symbol_short!("rm"), provider.clone()),
        (lp_amount, trade_out, xlm_out),
    );
}

pub fn publish_swap_token_for_xlm(e: &Env, user: &Address, trade_in: i128, xlm_out: i128) {
    e.events()
        .publish((symbol_short!("swap_t"), user.clone()), (trade_in, xlm_out));
}

pub fn publish_swap_xlm_for_token(e: &Env, user: &Address, xlm_in: i128, trade_out: i128) {
    e.events()
        .publish((symbol_short!("swap_x"), user.clone()), (xlm_in, trade_out));
}
