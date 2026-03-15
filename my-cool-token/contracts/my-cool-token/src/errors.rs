use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NegativeAmount = 2,
    InsufficientBalance = 3,
    InsufficientAllowance = 4,
    InvalidExpirationLedger = 5,
    DecimalTooLarge = 6,
}
