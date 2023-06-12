import * as PhalaSdk from "@phala/sdk";
import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ContractType,
  ContractFactory,
  RuntimeContext,
  TxHandler,
} from "@devphase/service";
import { Lego } from "@/typings/Lego";
import { SampleOracle } from "@/typings/SampleOracle";
import { PinkSystem } from "@/typings/PinkSystem";

import "dotenv/config";
import { loadInkAbi, callCfg } from "./utils";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUntil(async_fn, timeout) {
  const t0 = new Date().getTime();
  while (true) {
    if (await async_fn()) {
      return;
    }
    const t = new Date().getTime();
    if (t - t0 >= timeout) {
      throw new Error("timeout");
    }
    await sleep(100);
  }
}

describe("Run lego actions", () => {
  let legoFactory: Lego.Factory;
  let sampleOracleFactory: SampleOracle.Factory;
  let qjsFactory: ContractFactory;
  let lego: Lego.Contract;
  let sampleOracle: SampleOracle.Contract;
  let systemFactory: PinkSystem.Factory;
  let system: PinkSystem.Contract;

  let api: ApiPromise;
  let alice: KeyringPair;
  let certAlice: PhalaSdk.CertificateData;
  let currentStack: string;

  before(async function () {
    currentStack = (await RuntimeContext.getSingleton()).paths.currentStack;
    console.log("clusterId:", this.devPhase.mainClusterId);
    console.log(`currentStack: ${currentStack}`);

    system = await this.devPhase.getSystemContract(this.devPhase.mainClusterId);

    legoFactory = await this.devPhase.getFactory("lego", {
      contractType: ContractType.InkCode,
    });
    qjsFactory = await this.devPhase.getFactory("qjs", {
      contractType: ContractType.IndeterministicInkCode,
    });
    sampleOracleFactory = await this.devPhase.getFactory("sample_oracle", {
      contractType: ContractType.InkCode,
    });

    await qjsFactory.deploy();
    await sampleOracleFactory.deploy();
    await legoFactory.deploy();

    api = this.api;
    alice = this.devPhase.accounts.alice;
    certAlice = await PhalaSdk.signCertificate({
      api,
      pair: alice,
    });

    await TxHandler.handle(
      system.tx["system::upgradeRuntime"](
        { gasLimit: "10000000000000" },
        [1, 1]
      ),
      alice,
      'system::upgradeRuntime([1,1])'
    );

    await TxHandler.handle(
      system.tx["system::setDriver"](
        { gasLimit: "10000000000000" },
        "JsDelegate",
        qjsFactory.metadata.source.hash
      ),
      alice,
      'system::setDriver("JsDelegate")'
    );

    await checkUntil(async () => {
      const { output } = await system.query["system::getDriver"](
        certAlice,
        {},
        "JsDelegate"
      );
      return output?.asOk?.isSome;
    }, 1000 * 10);
    console.log("Signer:", alice.address.toString());
  });

  describe("Run actions", () => {
    before(async function () {
      this.timeout(30_000);
      // Deploy contract
      lego = await legoFactory.instantiate("default", [], {
        transferToCluster: 1e12,
      });
      sampleOracle = await sampleOracleFactory.instantiate("default", [], {});
      await sleep(3_000);
    });

    it("can run actions", async function () {
      const callee = sampleOracle.address.toHex();
      console.log("callee:", callee);
      console.log("loading ink abi...");
      const inkAbi = await loadInkAbi({
        contracts: ["./artifacts/sample_oracle/sample_oracle.json"],
        exports: ["config"],
      });
      console.log(`abi:\n${JSON.stringify(inkAbi)}`);

      const test_input = {
        rpc: "ws://foo.bar",
        price: { Some: 42 },
        compat_u32: 1234,
        enums: ["Foo", { Bar: 123 }, { Baz: { a: 1, b: 2 } }],
        result1: [{ Ok: 123 }, { Err: "Error message" }],
        result2: [{ Ok: [] }, { Err: "Error message" }],
        tuple0: [],
        tuple1: [123],
        arr: [1, 2],
        u8arr: "0x0102",
        u8vec: "0x0203",
      };

      const workflow = JSON.stringify({
        version: 1,
        debug: true,
        types: inkAbi.typeRegistry,
        actions: [
          // {
          //   cmd: "call",
          //   input: [test_input],
          //   config: callCfg(callee, inkAbi.contracts.sample_oracle.config),
          // },
          { cmd: "fetch", config: { url: "https://files.kvin.wang:8443/1m.txt", returnTextBody: false } },
          // { cmd: "eval", config: "console.log(JSON.stringify(input))" },
          // { cmd: "log" },
        ],
      });

      console.log(`workflow:\n${workflow}`);
      const result = await lego.query.run(certAlice, {}, workflow);
      expect(result.result.isOk).to.be.true;
    });
  });
});
