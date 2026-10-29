import { AsyncLocalStorage } from "node:async_hooks";

export type ServerEnv = { NEBIUS_API_KEY?: string; NEBIUS_MODEL?: string };
const requestEnv = new AsyncLocalStorage<ServerEnv>();

export function runWithServerEnv<T>(env: ServerEnv, run: () => T): T {
  return requestEnv.run(env, run);
}

export function getServerEnv(): ServerEnv {
  return requestEnv.getStore() ?? {
    NEBIUS_API_KEY: process.env.NEBIUS_API_KEY,
    NEBIUS_MODEL: process.env.NEBIUS_MODEL,
  };
}
