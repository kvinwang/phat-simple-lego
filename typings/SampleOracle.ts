import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace SampleOracle {
    type InkEnv_Types_AccountId = any;
    type PrimitiveTypes_H160 = any;
    type SampleOracle_SampleOracle_Error = { BadOrigin: null } | { NotConfigurated: null } | { BadAbi: null } | { FailedToGetStorage: null } | { FailedToDecodeStorage: null } | { FailedToEstimateGas: null } | { FailedToCreateRollupSession: null } | { FailedToFetchLock: null } | { FailedToReadQueueHead: null };
    type Result = { Ok: never[] } | { Err: SampleOracle_SampleOracle_Error };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<InkEnv_Types_AccountId>>>;
        }

        export interface HandleReq extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, eth_usd_price: number): DPT.CallResult<DPT.CallOutcome<DPT.ITuple<[  ]>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        owner: ContractQuery.Owner;
        handleReq: ContractQuery.HandleReq;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, anchor: PrimitiveTypes_H160): DPT.SubmittableExtrinsic;
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
