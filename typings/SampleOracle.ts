import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace SampleOracle {
    type InkPrimitives_LangError$3 = {
        CouldNotReadInput? : null
        };
    type Result$1 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$3
        };
    type Option$5 = {
        None? : null,
        Some? : number
        };
    type SampleOracle_SampleOracle_Enum$6 = {
        Foo? : null,
        Bar? : number,
        Baz? : [number, number]
        };
    type Result$7 = {
        Ok? : number,
        Err? : string
        };
    type Result$8 = {
        Ok? : never[],
        Err? : string
        };
    type SampleOracle_SampleOracle_Config$4 = { rpc: string, price: Option$5, compat_u32: number, enums: SampleOracle_SampleOracle_Enum$6[], result1: DPT.FixedArray<Result$7, 2>, result2: DPT.FixedArray<Result$8, 2>, tuple0: never[], tuple1: [ number ], arr: DPT.FixedArray<number, 2>, u8arr: DPT.FixedArray<number, 2>, u8vec: number[] | string };
    type Result$10 = {
        Ok? : string,
        Err? : InkPrimitives_LangError$3
        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, config: SampleOracle_SampleOracle_Config$4): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        config: ContractTx.Config;
    }

    /** */
    /** Contract */
    /** */
    export declare class Contract extends DPT.Contract {
        get query(): MapMessageQuery;
        get tx(): MapMessageTx;
    }

    /** */
    /** Contract factory */
    /** */
    export declare class Factory extends DevPhase.ContractFactory {
        instantiate<T = Contract>(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
