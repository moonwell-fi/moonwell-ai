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
