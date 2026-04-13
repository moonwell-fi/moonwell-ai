import type { Address, PublicClient, Transport, Chain } from "viem";
import { isAddress, getAddress } from "viem";
import { comptrollerAbi, mTokenAbi } from "./abis.js";
import { getContracts } from "./contracts.js";
import { unsupported, usage } from "./errors.js";

/**
 * Resolve the mToken address for a given underlying asset.
 *
 * If poolAddress is provided explicitly (via --pool-address), use it directly.
 * Otherwise, query Comptroller.getAllMarkets() and batch-resolve underlying()
 * to find the matching mToken.
 */
export async function resolveMToken(
  viemClient: PublicClient<Transport, Chain>,
  chainId: number,
  underlyingAddress: Address,
  poolAddress?: string,
): Promise<Address> {
  // Explicit override
  if (poolAddress) {
    if (!isAddress(poolAddress)) {
      throw usage("Invalid --pool-address (mToken address)");
    }
    return getAddress(poolAddress);
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
