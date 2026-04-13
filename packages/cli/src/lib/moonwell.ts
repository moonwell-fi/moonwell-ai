import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";
import type { ChainConfig, NetworkName } from "./chains.js";
import { SUPPORTED_CHAINS } from "./chains.js";

type MoonwellClient = ReturnType<typeof createMoonwellClient>;

let cachedClient: MoonwellClient | null = null;
let cachedRpcOverrides: Record<string, string> = {};

/**
 * Get or create a Moonwell SDK client. Reuses the same instance within a
 * CLI invocation. Pass rpcUrl to override a specific chain's RPC.
 */
export function getMoonwellClient(rpcOverride?: {
  network: NetworkName;
  url: string;
}): MoonwellClient {
  const overrides = rpcOverride
    ? { [rpcOverride.network]: rpcOverride.url }
    : {};

  // Reuse cached client if overrides match
  if (
    cachedClient &&
    JSON.stringify(overrides) === JSON.stringify(cachedRpcOverrides)
  ) {
    return cachedClient;
  }

  const networks: Record<string, { rpcUrls: string[] }> = {};
  for (const [name, config] of Object.entries(SUPPORTED_CHAINS)) {
    const rpcUrl = overrides[name] ?? config.defaultRpcUrl;
    networks[name] = { rpcUrls: [rpcUrl] };
  }

  cachedClient = createMoonwellClient({ networks });
  cachedRpcOverrides = overrides;
  return cachedClient;
}

/**
 * Build the SDK client for a specific chain config + optional RPC override.
 */
export function clientForChain(
  chain: ChainConfig,
  rpcUrl?: string,
): MoonwellClient {
  if (rpcUrl) {
    return getMoonwellClient({ network: chain.networkName, url: rpcUrl });
  }
  return getMoonwellClient();
}
