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
  /** True iff eth_estimateGas on the first transaction did not revert. */
  gasEstimateSucceeded: boolean;
  /** Gas estimate (decimal string) when gasEstimateSucceeded === true. */
  gasEstimate?: string;
  /** Sanitized revert reason or RPC error when gasEstimateSucceeded === false. */
  error?: string;
  /**
   * Steps not simulated. Multi-step prepares only simulate step 1; later
   * steps depend on prior on-chain state.
   */
  skippedSteps?: string[];
  /**
   * Human-readable note explaining what simulation does and does not prove
   * — see SKILL.md for full caveats around Compound v2 error codes.
   */
  note?: string;
}

/**
 * Machine-checkable mirror of the human-readable `requirements[]`.
 * Agents should check `preconditions[]` before broadcasting.
 */
export type Precondition =
  | {
      type: "balance";
      asset: string;
      assetAddress: Address;
      min: string;
      minDecimal: string;
    }
  | {
      type: "mtoken-balance";
      mToken: Address;
      minUnderlying: string;
      minUnderlyingDecimal: string;
    }
  | {
      type: "collateral-entered";
      mToken: Address;
    }
  | {
      type: "health-factor";
      /** Account health factor must remain >= this value after the action. */
      minAfter: number;
    }
  | {
      type: "gas";
      transactionCount: number;
    };

export interface PrepareResult {
  operation: LendVerb;
  chain: string;
  chainId: number;
  from: Address;
  transactions: UnsignedTx[];
  /** Human-readable constraints (kept for back-compat / display). */
  requirements: string[];
  /** Structured, machine-checkable mirror of `requirements[]`. */
  preconditions: Precondition[];
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
