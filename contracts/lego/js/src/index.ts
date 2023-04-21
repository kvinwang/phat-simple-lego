import { ScaleEncoder, ScaleDecoder, TypeRegistry } from "@phala/pink-env";

const pink = globalThis.pink;
const $ = pink.SCALE;

type HexString = `0x${string}`;
interface BaseAction {
  name?: string;
  input?: any;
}

interface ActionLog extends BaseAction {
  cmd: "log";
}

interface ActionEval extends BaseAction {
  cmd: "eval";
  config: string;
}

interface ActionFetch extends BaseAction {
  cmd: "fetch";
  config?: string | FetchConfig;
}

interface ActionCall extends BaseAction {
  cmd: "call";
  config: {
    callee: HexString | Uint8Array;
    selector: number;
  };
}

interface ActionScale extends BaseAction {
  cmd: "scale";
  config: {
    subcmd: "encode" | "decode";
    type: number[] | number;
  };
}

interface FetchConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  allowNon2xx?: boolean;
  returnTextBody?: boolean;
}

type Action = ActionLog | ActionEval | ActionFetch | ActionCall | ActionScale;

function doEval(script: string, input: any, context: any): any {
  return eval(script);
}

(function () {
  function actionFetch(action: ActionFetch, input: any): any {
    let base: FetchConfig;
    if (typeof action.config === "string") {
      base = { url: action.config };
    } else {
      base = action.config;
    }
    let req: FetchConfig = {};
    if (typeof input === "string" || typeof input === "object") {
      if (typeof input === "string" && input.length > 0) {
        req = { url: input };
      } else {
        req = input;
      }
    }
    req = {
      ...base,
      ...req,
    };
    const { url, method, headers, body, returnTextBody } = req;
    if (typeof url !== "string") {
      throw new Error("invalid url");
    }
    const response = pink.httpRequest({
      url,
      method,
      headers,
      body,
      returnTextBody,
    });
    const statusCode = response.statusCode;
    if (
      !req.allowNon2xx &&
      (statusCode < 200 || statusCode >= 300)
    ) {
      throw new Error(
        `http error: ${statusCode}`
      );
    }
    return response;
  }

  function actionEval(action: ActionEval, input: any, context: any): any {
    const script = action.config;
    if (typeof script !== "string") {
      throw new Error("Trying to eval non-string");
    }
    return doEval(script, input, context);
  }

  function actionCall(action: ActionCall, input: any): Uint8Array {
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

  function newEnc(
    type: number | number[],
    typeRegistry: TypeRegistry
  ): ScaleEncoder {
    if (typeof type === "number") {
      return $.createEncoderForTypeId(type, typeRegistry);
    } else {
      return $.createTupleEncoder(type, typeRegistry);
    }
  }

  function newDec(
    type: number | number[],
    typeRegistry: TypeRegistry
  ): ScaleDecoder {
    if (typeof type === "number") {
      return $.createDecoderForTypeId(type, typeRegistry);
    } else {
      return $.createTupleDecoder(type, typeRegistry);
    }
  }

  function actionScale(
    action: ActionScale,
    input: any,
    typeRegistry: TypeRegistry
  ): any {
    const { subcmd, type } = action.config;
    if (subcmd === "encode") {
      const encoder = newEnc(type, typeRegistry);
      return $.encode(input, encoder);
    } else if (subcmd === "decode") {
      const decoder = newDec(type, typeRegistry);
      return $.decode(input, decoder);
    } else {
      throw new Error(`unknown scale subcmd: ${subcmd}`);
    }
  }

  function runAction(context: any, action: Action, input: any): any {
    switch (action.cmd) {
      case "call":
        return actionCall(action, input);
      case "eval":
        return actionEval(action, input, context);
      case "fetch":
        return actionFetch(action, input);
      case "scale":
        return actionScale(action, input, context.typeRegistry);
      case "log":
        return input;
      default:
        throw new Error(`unknown action: ${(<any>action).cmd}`);
    }
  }

  function pipeline(actions: Action[], types: string): void {
    const typeRegistry = $.parseTypes(types);
    console.log(`typeRegistry: ${JSON.stringify(typeRegistry, null, 2)}`);

    let input: any = "";
    let context: any = {
      typeRegistry,
    };
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.input !== undefined) {
        input = action.input;
      }
      const name = action.name ?? action.cmd;
      console.log(`running action [${name}], ${action.cmd}(input=${input})`);
      const output = runAction(context, action, input);
      input = output;
      if (action.name?.length > 0) {
        context[name] = { output };
      }
    }
  }

  // TODO: Is there a simple way to dynamic validate the external json value against the ts type definition?
  const actions = scriptArgs[0];
  const types = scriptArgs[1];
  console.log(`actions: ${actions}`);
  console.log(`types: ${types}`);
  pipeline(JSON.parse(actions), types);
})();
