import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";
import type { ChainConfig } from "./chains.js";
import { SUPPORTED_CHAINS } from "./chains.js";

type MoonwellClient = ReturnType<typeof createMoonwellClient>;

interface RpcUrls {
  base: string;
  optimism: string;
}

/**
 * Worker variant — stateless. Each request builds a fresh SDK client from
 * env-provided RPC URLs. We don't share clients across requests because
 * isolate reuse on Workers means cross-tenant state would otherwise leak.
 */
export function makeMoonwellClient(rpcs: RpcUrls): MoonwellClient {
  const networks: Record<string, { rpcUrls: string[] }> = {};
  for (const name of Object.keys(SUPPORTED_CHAINS)) {
    const url = rpcs[name as keyof RpcUrls];
    networks[name] = { rpcUrls: [url] };
  }
  return createMoonwellClient({ networks });
}

/** Pick the right RPC URL for a chain. */
export function rpcFor(chain: ChainConfig, rpcs: RpcUrls): string {
  return rpcs[chain.networkName];
}
