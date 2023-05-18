#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

#[ink::contract]
mod lego {
    use alloc::string::String;
    use phat_js as js;
    use pink_extension::ResultExt;

    #[ink(storage)]
    pub struct Lego {}

    impl Lego {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn run(&self, actions: String) -> bool {
            let script = include_str!("./js/dist/index.js");
            // TODO.kevin: propagate the error
            js::eval(script, &[actions])
                .log_err("Failed to run actions")
                .is_ok()
        }
    }
}
