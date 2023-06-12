#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use crate::sample_oracle::*;

#[ink::contract]
mod sample_oracle {
    use alloc::vec::Vec;
    use alloc::string::String;
    use pink_extension as pink;
    use scale::{Decode, Encode};

    #[ink(storage)]
    pub struct SampleOracle {}

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Enum {
        #[codec(index = 10)]
        Foo,
        Bar(u32),
        Baz { a: u32, b: u32 },
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Config {
        rpc: String,
        price: Option<u128>,
        compat_u32: u32,
        enums: Vec<Enum>,
        result1: [Result<u32, String>; 2],
        result2: [Result<(), String>; 2],
        tuple0: (),
        tuple1: (u32,),
        arr: [u32; 2],
        u8arr: [u8; 2],
        u8vec: Vec<u8>,
    }

    impl SampleOracle {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn config(&mut self, config: Config) -> String {
            pink::info!("config({config:?})");
            alloc::format!("{config:?}")
        }
    }
}
