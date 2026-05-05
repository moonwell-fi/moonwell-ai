import type { Address } from "viem";

// --- Output envelope ---

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta: {
    command: string;
    chain: string;
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
  value: string;
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
