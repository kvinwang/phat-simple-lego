const pink = globalThis.pink;

import "./polyfills.js";
import "@phala/pink-env";
import * as scaleCore from "@scale-codec/core";

type HexString = `0x${string}`;
type Named = {
  name?: string;
};

interface ActionLog extends Named {
  cmd: "log";
  config?: string;
}

interface ActionEval extends Named {
  cmd: "eval";
  config: string;
}

interface ActionFetch extends Named {
  cmd: "fetch";
  config?: string | FetchConfig;
}

interface ActionCall extends Named {
  cmd: "call";
  config: {
    callee: HexString | Uint8Array;
    selector: number;
  };
}

type FetchConfig = {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";
  headers?: Record<string, string>;
  body?: string | Uint8Array;
};

type Action = ActionLog | ActionEval | ActionFetch | ActionCall;

class Handler {
  static fetch(action: ActionFetch, input: any): any {
    var base;
    if (typeof action.config == "string") {
      base = { url: action.config };
    } else {
      base = action.config || {};
    }
    var req: any = {};
    if (input) {
      if (typeof input === "string" && input.length > 0) {
        req = { url: input };
      } else {
        req = input || {};
      }
    }
    req = {
      ...base,
      ...req,
    };
    const response = pink.httpRequest(req);
    if (
      !req.allowNon2xx &&
      (response.statusCode < 200 || response.statusCode >= 300)
    ) {
      throw new Error(
        `http request failed with status code ${response.statusCode}`
      );
    }
    return response;
  }

  static call(action: ActionCall, input: any): Uint8Array {
    const args = action.config;
    if (!(input instanceof Uint8Array)) {
      throw new Error("call contract input must be a Uint8Array");
    }
    const output = pink.invokeContract({
      ...args,
      input,
    });
    return output;
  }

  static eval(action: ActionEval, input: any): any {
    const script = action.config;
    if (typeof script !== "string") {
      throw new Error("Trying to eval non-string");
    }
    const scale = {
      encode: scaleCore.WalkerImpl.encode,
      encodeU128: scaleCore.encodeU128,
      encodeU64: scaleCore.encodeU64,
      encodeU32: scaleCore.encodeU32,
      encodeU16: scaleCore.encodeU16,
      encodeUint8Vec: scaleCore.encodeUint8Vec,
      encodeStr: scaleCore.encodeStr,
      createStructEncoder: scaleCore.createStructEncoder,
      createEnumEncoder: scaleCore.createEnumEncoder,
    };
    return eval(script);
  }
}

function runAction(action: Action, input: any): any {
  switch (action.cmd) {
    case "call":
      return Handler.call(action, input);
    case "eval":
      return Handler.eval(action, input);
    case "fetch":
      return Handler.fetch(action, input);
    case "log":
      return input;
    default:
      throw new Error(`unknown action: ${(<any>action).cmd}`);
  }
}

function pipeline(actions: Action[], initInput: string) {
  var input: any = initInput;
  for (var i = 0; i < actions.length; i++) {
    const action = actions[i];
    const name = action.name || action.cmd;
    console.log(`running action [${name}], ${action.cmd}(input=${input})`);
    input = runAction(action, input);
  }
}

(function () {
  console.log(`Actions: ${scriptArgs[0]}`);
  // TODO: Is there a simple way to dynamic validate the external json value against the ts type definition?
  let actions = JSON.parse(scriptArgs[0]);
  var input = scriptArgs[1];
  pipeline(actions, input);
})();
