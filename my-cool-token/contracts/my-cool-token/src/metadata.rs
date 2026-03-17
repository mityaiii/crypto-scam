use soroban_sdk::{Env, String};
use soroban_token_sdk::{metadata::TokenMetadata, TokenUtils};

pub fn write_metadata(e: &Env, decimal: u32, name: String, symbol: String) {
    TokenUtils::new(e).metadata().set_metadata(&TokenMetadata {
        decimal,
        name,
        symbol,
    });
}

pub fn read_decimal(e: &Env) -> u32 {
    TokenUtils::new(e).metadata().get_metadata().decimal
}

pub fn read_name(e: &Env) -> String {
    TokenUtils::new(e).metadata().get_metadata().name
}

pub fn read_symbol(e: &Env) -> String {
    TokenUtils::new(e).metadata().get_metadata().symbol
}
