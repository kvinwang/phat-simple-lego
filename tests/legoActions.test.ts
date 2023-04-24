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

      function cfg(o: object) {
        return JSON.stringify(o);
      }
      const actions = `[
            {"cmd": "fetch", "config": ${cfg({
              returnTextBody: true,
              url: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR",
            })}},
            {"cmd": "eval", "name": "parse_response", "config": "BigInt(Math.round(JSON.parse(input.body).USD * 1000000))"},
            {"cmd": "eval", "name": "reshape_input", "config": "({rpc: 'http://rpc.kvin.wang', price: input})" },
            {"cmd": "scale", "name": "scale_encode", "config": ${cfg({ subcmd: "encode", type: 3 })}},
            {"cmd": "call", "name": "call_contract", "config": ${cfg({ callee, selector: 0x70714744 })}},
            {"cmd": "scale", "name": "scale_decode", "config": ${cfg({ subcmd: "decode", type: 6 })}},
            {"cmd": "eval", "name": "print_result", "config": "console.log('contract output:', JSON.stringify(input))"}
      ]`;
      const types = `
<Ok:1,Err:2>
()
<CouldNotReadInput::1>
{rpc:4,price:5}
#str
#u128
<Ok:4,Err:2>
`;
      const result = await lego.query.run(certAlice, {}, actions, types);
      expect(result.result.isOk).to.be.true;
    });
  });
});
