#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use crate::sample_oracle::*;

#[ink::contract]
mod sample_oracle {
    use alloc::string::String;
    use pink_extension as pink;
    use scale::{Decode, Encode};

    #[ink(storage)]
    pub struct SampleOracle {}

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Config {
        rpc: String,
        price: u128,
    }

    impl SampleOracle {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn config(&mut self, config: Config) -> String {
            pink::info!("config({config:?})");
            config.rpc
        }
    }
}
