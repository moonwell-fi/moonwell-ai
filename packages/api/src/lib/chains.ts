import { base, optimism } from "viem/chains";
import type { Chain } from "viem";
import { usage } from "./errors.js";

export type NetworkName = "base" | "optimism";

export interface ChainConfig {
  chainId: number;
  name: string;
  networkName: NetworkName;
  viemChain: Chain;
  defaultRpcUrl: string;
}

export const SUPPORTED_CHAINS: Record<NetworkName, ChainConfig> = {
  base: {
    chainId: 8453,
    name: "Base",
    networkName: "base",
    viemChain: base,
    defaultRpcUrl: "https://mainnet.base.org",
  },
  optimism: {
    chainId: 10,
    name: "Optimism",
    networkName: "optimism",
    viemChain: optimism,
    defaultRpcUrl: "https://mainnet.optimism.io",
  },
};

const CHAIN_ID_TO_NETWORK: Record<number, NetworkName> = {
  8453: "base",
  10: "optimism",
};

const CHAIN_ALIASES: Record<string, NetworkName> = {
  base: "base",
  "8453": "base",
  "eip155:8453": "base",
  optimism: "optimism",
  op: "optimism",
  "10": "optimism",
  "eip155:10": "optimism",
};

export function resolveChain(input: string): ChainConfig {
  const key = input.toLowerCase().trim();
  const networkName = CHAIN_ALIASES[key];
  if (!networkName) {
    throw usage(
      `Unsupported chain: "${input}". Supported: base, optimism (or chain IDs 8453, 10)`,
    );
  }
  return SUPPORTED_CHAINS[networkName];
}

export function chainIdToNetwork(chainId: number): NetworkName | undefined {
  return CHAIN_ID_TO_NETWORK[chainId];
}

export function caip2(chainId: number): string {
  return `eip155:${chainId}`;
}
