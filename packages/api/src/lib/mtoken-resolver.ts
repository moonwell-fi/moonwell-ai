import type { Address, PublicClient, Transport, Chain } from "viem";
import { isAddress, getAddress } from "viem";
import { comptrollerAbi, mTokenAbi } from "./abis.js";
import { getContracts } from "./contracts.js";
import { unsupported, usage } from "./errors.js";

export interface MarketHint {
  mTokenAddress: Address;
  underlyingAddress: Address;
}

/**
 * Resolve the mToken address for a given underlying asset.
 *
 * Resolution order:
 *   1. If `poolAddress` is provided, use it directly (explicit override).
 *   2. If `marketHints` is provided, scan it for an underlying match and
 *      return the corresponding mToken without any RPC calls. Callers that
 *      already fetched the SDK's `getMarkets()` list (CLI lend commands,
 *      API `/prepare/*`) should pass it here — saves a round-trip to
 *      Comptroller.getAllMarkets() plus an N-way `underlying()` multicall
 *      on every signed call.
 *   3. Fall back to on-chain resolution via Comptroller.
 */
export async function resolveMToken(
  viemClient: PublicClient<Transport, Chain>,
  chainId: number,
  underlyingAddress: Address,
  poolAddress?: string,
  marketHints?: readonly MarketHint[],
): Promise<Address> {
  // Explicit override
  if (poolAddress) {
    if (!isAddress(poolAddress)) {
      throw usage("Invalid --pool-address (mToken address)");
    }
    return getAddress(poolAddress);
  }

  // Caller-supplied hints — short-circuit when possible.
  if (marketHints?.length) {
    const target = underlyingAddress.toLowerCase();
    const hit = marketHints.find(
      (h) => h.underlyingAddress.toLowerCase() === target,
    );
    if (hit) return getAddress(hit.mTokenAddress);
    // Hints didn't include this underlying — fall through to on-chain
    // (rare: SDK markets list and Comptroller.getAllMarkets() can drift
    // around new listings before SDK release).
  }

  const contracts = getContracts(chainId);

  // Get all markets from Comptroller
  const markets = await viemClient.readContract({
    address: contracts.comptroller,
    abi: comptrollerAbi,
    functionName: "getAllMarkets",
  });

  // Batch-resolve underlying() for each market
  const underlyingCalls = markets.map((mToken) => ({
    address: mToken as Address,
    abi: mTokenAbi,
    functionName: "underlying" as const,
  }));

  const results = await viemClient.multicall({
    contracts: underlyingCalls,
    allowFailure: true,
  });

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "success") {
      const addr = result.result as Address;
      if (addr.toLowerCase() === underlyingAddress.toLowerCase()) {
        return getAddress(markets[i] as string);
      }
    }
  }

  throw unsupported(
    `No Moonwell mToken found for underlying ${underlyingAddress} on chain ${chainId}. Pass --pool-address with the mToken address.`,
  );
}
