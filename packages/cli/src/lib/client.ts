import { createPublicClient, http } from "viem";
import type { PublicClient, Transport, Chain } from "viem";
import type { ChainConfig } from "./chains.js";

/**
 * Create a viem PublicClient for write-side operations (simulation, allowance
 * checks, market membership checks). Read-side queries use the Moonwell SDK.
 */
export function getViemClient(
  chain: ChainConfig,
  rpcUrl?: string,
): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: chain.viemChain,
    transport: http(rpcUrl ?? chain.defaultRpcUrl),
  });
}
