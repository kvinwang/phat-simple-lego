const pink = globalThis.pink;

import "./polyfills.js";
import "@phala/pink-env";
import * as scaleCore from "@scale-codec/core";

interface Action {
  cmd: string;
  name?: string;
  config: string | object;
}

function pipeline(actions: Action[], initInput: string) {
  var input: any = initInput;
  for (var i = 0; i < actions.length; i++) {
    const action = actions[i];
    const name = action.name || action.cmd;
    console.log(
      `running action [${name}], ${action.cmd}(input=${input})`
    );
    input = runAction(action, input);
  }
}

function runAction({ cmd, config }: Action, input: any): any {
  switch (cmd) {
    case "call":
      return actionCall(config, input);
    case "eval":
      return actionEval(config, input);
    case "fetch":
      return actionFetch(config, input);
    case "log":
      return input;
    default:
      throw new Error(`unknown action: ${cmd}`);
  }
}

function actionFetch(config: any, input: any): any {
  var base = config || {};
  var req: any = {};
  if (input) {
    if (typeof input === "string" && input.length > 0) {
      req = { url: input };
    } else {
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

function actionCall(config: any, input: any): Uint8Array {
  const args: {
    callee: string;
    selector: number;
  } = config;
  if (!(input instanceof Uint8Array)) {
    throw new Error("call contract input must be a Uint8Array");
  }
  const output = pink.invokeContract({
    ...args,
    input,
  });
  return output;
}

function actionEval(script: any, input: any): any {
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

(function () {
  console.log(`Actions: ${scriptArgs[0]}`);
  let actions = JSON.parse(scriptArgs[0]);
  var input = scriptArgs[1];
  pipeline(actions, input);
})();
