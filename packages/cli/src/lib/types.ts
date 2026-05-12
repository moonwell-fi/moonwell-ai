import type { Address } from "viem";

// --- Output envelope ---

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta: {
    command: string;
    /**
     * CAIP-2 chain ID (e.g. "eip155:8453") when chain context is resolved.
     * `null` when the envelope fires before chain resolution (validation errors).
     */
    chain: string | null;
    timestamp: string;
  };
  error?: string;
}

// --- Write command types ---

export type LendVerb = "supply" | "withdraw" | "borrow" | "repay";

export interface UnsignedTx {
  step: string;
  description: string;
  to: Address;
  data: `0x${string}`;
  /** 0x-prefixed hex, EIP-5792 / JSON-RPC convention. e.g. "0x0" or "0x16345785d8a0000". */
  value: `0x${string}`;
  chainId: number;
}

export interface SimulationResult {
  success: boolean;
  gasEstimate?: string;
  error?: string;
  skippedSteps?: string[];
}

export interface PrepareResult {
  operation: LendVerb;
  chain: string;
  chainId: number;
  from: Address;
  transactions: UnsignedTx[];
  requirements: string[];
  preview: {
    asset: string;
    amount: string;
    amountDecimal: string;
    mToken: Address;
    estimatedAPY?: number;
  };
  warnings: string[];
  simulation?: SimulationResult;
}

// --- Global CLI options ---

export interface GlobalOptions {
  chain?: string;
  rpcUrl?: string;
  json?: boolean;
}
