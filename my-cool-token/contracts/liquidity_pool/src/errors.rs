use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    PoolEmpty = 4,
    InvalidRatio = 5,
    SlippageExceeded = 6,
    InsufficientLiquidity = 7,
    MathOverflow = 8,
    DivisionByZero = 9,
}
