import { createPublicClient, http } from "viem";
import type { PublicClient, Transport, Chain } from "viem";
import type { ChainConfig } from "./chains.js";

/**
 * Worker variant of the viem client factory.
 *
 * Unlike the CLI variant, the rpcUrl is required — the worker has no notion
 * of a "default RPC" because public RPCs serve stale state and we always
 * read URLs from `c.env.{BASE,OPTIMISM}_RPC_URL` (set via `wrangler secret put`).
 */
export function getViemClient(
  chain: ChainConfig,
  rpcUrl: string,
): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: chain.viemChain,
    transport: http(rpcUrl),
  });
}
