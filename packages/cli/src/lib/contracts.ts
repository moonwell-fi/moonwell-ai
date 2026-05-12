import type { Address } from "viem";

export interface ChainContracts {
  comptroller: Address;
  rewardDistributor: Address;
}

export const MOONWELL_CONTRACTS: Record<number, ChainContracts> = {
  // Base
  8453: {
    comptroller: "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C",
    rewardDistributor: "0xe9005b078701e2A0948D2EaC43010D35870Ad9d2",
  },
  // Optimism
  10: {
    comptroller: "0xCa889f40aae37FFf165BccF69aeF1E82b5C511B9",
    rewardDistributor: "0xF9524bfa18C19C3E605FbfE8DFd05C6e967574Aa",
  },
};

export function getContracts(chainId: number): ChainContracts {
  const contracts = MOONWELL_CONTRACTS[chainId];
  if (!contracts) {
    throw new Error(
      `Moonwell is not deployed on chain ${chainId}. Supported: Base (8453), Optimism (10)`,
    );
  }
  return contracts;
}

/**
 * Canonical WETH ERC-20 addresses per chain. Both Base and Optimism use the
 * Superchain WETH predeploy at 0x42…06.
 *
 * Moonwell's mWETH market reports `underlyingToken.symbol = "ETH"` and
 * `address = 0x000…000` via the SDK — but on-chain approvals must target
 * the real ERC-20 contract. Use this table when the SDK underlying is the
 * zero address.
 */
export const WETH_ADDRESSES: Record<number, Address> = {
  8453: "0x4200000000000000000000000000000000000006",
  10: "0x4200000000000000000000000000000000000006",
};

export function getWethAddress(chainId: number): Address {
  const addr = WETH_ADDRESSES[chainId];
  if (!addr) {
    throw new Error(`No WETH address known for chain ${chainId}`);
  }
  return addr;
}

export const ZERO_ADDRESS: Address =
  "0x0000000000000000000000000000000000000000";

/**
 * mToken addresses flagged as deprecated. Routes expose a `deprecated: true`
 * flag on these so clients can filter them out of default selections.
 *
 * Addresses are stored lowercased so callers don't need to checksum-match.
 *
 * Currently: Base mUSDbC (legacy bridged-USDC market). It still resolves
 * because Coinbase deprecated the bridged USDbC token in favor of canonical
 * USDC, and the Moonwell market sticks around for existing positions to
 * unwind.
 */
export const DEPRECATED_MARKETS: Record<number, ReadonlySet<string>> = {
  8453: new Set<string>([
    "0x703843c3379b52f9ff486c9f5892218d2a065cc8", // mUSDbC
  ]),
  10: new Set<string>(),
};

export function isDeprecatedMarket(
  chainId: number,
  mTokenAddress: string,
): boolean {
  return Boolean(
    DEPRECATED_MARKETS[chainId]?.has(mTokenAddress.toLowerCase()),
  );
}
