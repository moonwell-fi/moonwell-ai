import {
  encodeFunctionData,
  getAddress,
  type Address,
  type PublicClient,
  type Transport,
  type Chain,
} from "viem";
import { mTokenAbi, comptrollerAbi, erc20Abi } from "./abis.js";
import { getContracts, getWethAddress, ZERO_ADDRESS } from "./contracts.js";
import { usage } from "./errors.js";
import type {
  LendVerb,
  Precondition,
  PrepareResult,
  UnsignedTx,
  SimulationResult,
} from "./types.js";
import { caip2 } from "./chains.js";

/**
 * Minimal subset of the SDK's Market type we touch here. Avoids a hard
 * dependency on @moonwell-fi/moonwell-sdk inside the shared lib (the API
 * worker, CLI, and tests can all construct conforming objects).
 */
export interface MarketForResolution {
  underlyingToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  marketToken: { symbol: string; address: string };
  /** Optional — passed through as `estimatedAPY` in PrepareResult.preview. */
  baseSupplyApy?: number;
}

export interface ResolvedAsset {
  /** The SDK market row that matched. */
  market: MarketForResolution;
  /**
   * On-chain ERC-20 address to use for allowance / approve. For the
   * mWETH market the SDK reports 0x000…0 here; we swap in the chain's
   * real WETH predeploy so viem doesn't crash trying to call allowance
   * on the zero address.
   */
  assetAddress: Address;
  assetDecimals: number;
  /**
   * Display symbol. Normalized to "WETH" when the caller passed "ETH"
   * or when the matched market is the SDK's "ETH" row, so warnings and
   * preview text are unambiguous downstream.
   */
  assetSymbol: string;
}

/**
 * Resolve the SDK market for a user-supplied asset symbol, applying the
 * WETH/ETH alias and the zero-address swap so both CLI and API agree on
 * what `--asset WETH` / `?asset=ETH` mean.
 *
 * Throws USAGE if no market matches.
 */
export function resolveAssetForLend(
  markets: readonly MarketForResolution[],
  chainId: number,
  requestedAsset: string,
  chainName: string,
): ResolvedAsset {
  const askedFor = requestedAsset.toUpperCase();
  // The SDK lists Moonwell's mWETH market as `underlyingToken.symbol = "ETH"`.
  // Accept both `WETH` and `ETH` from callers; both resolve to the same row.
  const matchSymbol = askedFor === "WETH" ? "ETH" : askedFor;

  const market = markets.find(
    (m) => m.underlyingToken.symbol.toUpperCase() === matchSymbol,
  );
  if (!market) {
    throw usage(
      `Asset "${requestedAsset}" not found in Moonwell markets on ${chainName}`,
    );
  }

  const sdkAssetAddr = getAddress(market.underlyingToken.address) as Address;
  const isWethMarket = matchSymbol === "ETH";
  // The SDK returns 0x000…0 for the mWETH market's underlying. On-chain
  // allowance/approve calls must target the real WETH ERC-20 contract.
  const assetAddress: Address =
    isWethMarket && sdkAssetAddr.toLowerCase() === ZERO_ADDRESS.toLowerCase()
      ? getWethAddress(chainId)
      : sdkAssetAddr;
  const assetSymbol = isWethMarket ? "WETH" : market.underlyingToken.symbol;

  return {
    market,
    assetAddress,
    assetDecimals: market.underlyingToken.decimals,
    assetSymbol,
  };
}

interface PrepareParams {
  verb: LendVerb;
  chainId: number;
  asset: string;
  assetAddress: Address;
  assetDecimals: number;
  amount: bigint;
  amountDecimal: string;
  from: Address;
  mToken: Address;
  viemClient: PublicClient<Transport, Chain>;
  simulate: boolean;
  estimatedAPY?: number;
}

export async function prepareLendAction(
  params: PrepareParams,
): Promise<PrepareResult> {
  const {
    verb,
    chainId,
    asset,
    assetAddress,
    amount,
    amountDecimal,
    from,
    mToken,
    viemClient,
    simulate,
    estimatedAPY,
  } = params;

  const transactions: UnsignedTx[] = [];
  const requirements: string[] = [];
  const preconditions: Precondition[] = [];
  const warnings: string[] = [];
  // Both `ETH` (SDK's symbol for the mWETH market) and `WETH` (the actual
  // ERC-20 symbol) need the wrap/unwrap warning. The route handler
  // substitutes the real WETH ERC-20 address when the SDK returns the
  // zero address for the underlying, so by the time we get here the
  // approval target is the WETH contract — but the warning is still owed.
  const isWethMarket =
    asset.toUpperCase() === "WETH" || asset.toUpperCase() === "ETH";

  switch (verb) {
    case "supply": {
      // Check and add approval if needed
      await appendApprovalIfNeeded(
        viemClient,
        transactions,
        chainId,
        assetAddress,
        from,
        mToken,
        amount,
        "Approve token for Moonwell supply",
      );

      // Check and add enterMarkets if needed
      await appendEnterMarketsIfNeeded(
        viemClient,
        transactions,
        chainId,
        from,
        mToken,
      );

      // mint(amount)
      transactions.push({
        step: "moonwell-supply",
        description: "Supply asset to Moonwell",
        to: mToken,
        data: encodeFunctionData({
          abi: mTokenAbi,
          functionName: "mint",
          args: [amount],
        }),
        value: "0x0",
        chainId,
      });

      requirements.push(`Sufficient ${asset} balance`, `Gas for ${transactions.length} transaction(s)`);
      preconditions.push(
        {
          type: "balance",
          asset,
          assetAddress,
          min: amount.toString(),
          minDecimal: amountDecimal,
        },
        { type: "gas", transactionCount: transactions.length },
      );

      if (isWethMarket) {
        warnings.push(
          "WETH supply requires wrapping native ETH first. Moonwell mWETH uses the ERC-20 WETH path.",
        );
      }
      break;
    }

    case "withdraw": {
      // redeemUnderlying(amount)
      transactions.push({
        step: "moonwell-withdraw",
        description: "Withdraw asset from Moonwell",
        to: mToken,
        data: encodeFunctionData({
          abi: mTokenAbi,
          functionName: "redeemUnderlying",
          args: [amount],
        }),
        value: "0x0",
        chainId,
      });

      requirements.push(
        `Sufficient mToken balance to redeem ${amountDecimal} ${asset}`,
        "Gas for 1 transaction",
      );
      preconditions.push(
        {
          type: "mtoken-balance",
          mToken,
          minUnderlying: amount.toString(),
          minUnderlyingDecimal: amountDecimal,
        },
        { type: "gas", transactionCount: 1 },
      );

      if (isWethMarket) {
        warnings.push(
          "Moonwell mWETH auto-unwraps to native ETH on withdraw. You will receive ETH, not WETH.",
        );
      }
      break;
    }

    case "borrow": {
      // borrow(amount)
      transactions.push({
        step: "moonwell-borrow",
        description: "Borrow asset from Moonwell",
        to: mToken,
        data: encodeFunctionData({
          abi: mTokenAbi,
          functionName: "borrow",
          args: [amount],
        }),
        value: "0x0",
        chainId,
      });

      requirements.push(
        "Sufficient collateral deposited and market entered",
        "Account health factor must remain above 1.0 after borrow",
        "Gas for 1 transaction",
      );
      preconditions.push(
        { type: "collateral-entered", mToken },
        { type: "health-factor", minAfter: 1.0 },
        { type: "gas", transactionCount: 1 },
      );

      if (isWethMarket) {
        warnings.push(
          "Moonwell mWETH auto-unwraps to native ETH on borrow. You will receive ETH, not WETH.",
        );
      }
      break;
    }

    case "repay": {
      // Check and add approval if needed
      await appendApprovalIfNeeded(
        viemClient,
        transactions,
        chainId,
        assetAddress,
        from,
        mToken,
        amount,
        "Approve token for Moonwell repay",
      );

      // repayBorrow(amount)
      transactions.push({
        step: "moonwell-repay",
        description: "Repay borrowed asset on Moonwell",
        to: mToken,
        data: encodeFunctionData({
          abi: mTokenAbi,
          functionName: "repayBorrow",
          args: [amount],
        }),
        value: "0x0",
        chainId,
      });

      requirements.push(`Sufficient ${asset} balance`, `Gas for ${transactions.length} transaction(s)`);
      preconditions.push(
        {
          type: "balance",
          asset,
          assetAddress,
          min: amount.toString(),
          minDecimal: amountDecimal,
        },
        { type: "gas", transactionCount: transactions.length },
      );

      if (isWethMarket) {
        warnings.push(
          "WETH repay requires wrapping native ETH first. Moonwell mWETH uses the ERC-20 WETH path.",
        );
      }
      break;
    }
  }

  // Simulate if requested
  let simulation: SimulationResult | undefined;
  if (simulate) {
    simulation = await simulateTransactions(viemClient, transactions, from);
  }

  return {
    operation: verb,
    chain: caip2(chainId),
    chainId,
    from,
    transactions,
    requirements,
    preconditions,
    preview: {
      asset,
      amount: amount.toString(),
      amountDecimal,
      mToken,
      estimatedAPY,
    },
    warnings,
    simulation,
  };
}

async function appendApprovalIfNeeded(
  viemClient: PublicClient<Transport, Chain>,
  transactions: UnsignedTx[],
  chainId: number,
  tokenAddress: Address,
  owner: Address,
  spender: Address,
  amount: bigint,
  description: string,
): Promise<void> {
  const allowance = await viemClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  });

  if (allowance < amount) {
    transactions.push({
      step: "approve",
      description,
      to: tokenAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      }),
      value: "0x0",
      chainId,
    });
  }
}

async function appendEnterMarketsIfNeeded(
  viemClient: PublicClient<Transport, Chain>,
  transactions: UnsignedTx[],
  chainId: number,
  account: Address,
  mToken: Address,
): Promise<void> {
  const contracts = getContracts(chainId);

  const isMember = await viemClient.readContract({
    address: contracts.comptroller,
    abi: comptrollerAbi,
    functionName: "checkMembership",
    args: [account, mToken],
  });

  if (!isMember) {
    transactions.push({
      step: "enter-market",
      description: "Enable asset as collateral on Moonwell",
      to: contracts.comptroller,
      data: encodeFunctionData({
        abi: comptrollerAbi,
        functionName: "enterMarkets",
        args: [[mToken]],
      }),
      value: "0x0",
      chainId,
    });
  }
}

/**
 * Reduce a multi-line viem / RPC error message to its first short line
 * with URLs scrubbed. Prevents leaking RPC endpoints, viem version strings,
 * stack traces, or contract call internals to API clients.
 */
function sanitizeRpcError(message: string): string {
  const firstLine = message.split("\n")[0].trim();
  return firstLine.replace(/https?:\/\/\S+/g, "<rpc-url>");
}

const SIMULATION_NOTE =
  "gasEstimateSucceeded only asserts that eth_estimateGas did not revert on step 1. Compound v2 functions can fail business-logic checks without reverting; always check on-chain receipts after broadcast.";

async function simulateTransactions(
  viemClient: PublicClient<Transport, Chain>,
  transactions: UnsignedTx[],
  from: Address,
): Promise<SimulationResult> {
  // Only simulate the first step. Steps 2+ depend on prior steps being
  // on-chain (e.g., mint depends on approve), so independent simulation
  // would always fail and produce misleading results.
  if (transactions.length === 0) {
    return { gasEstimateSucceeded: true, gasEstimate: "0", note: SIMULATION_NOTE };
  }

  const first = transactions[0];
  const skippedSteps = transactions.slice(1).map((tx) => tx.step);

  try {
    const gas = await viemClient.estimateGas({
      account: from,
      to: first.to,
      data: first.data,
      // BigInt("0x…") parses hex; matches UnsignedTx.value's EIP-5792 format.
      value: BigInt(first.value),
    });
    return {
      gasEstimateSucceeded: true,
      gasEstimate: gas.toString(),
      skippedSteps: skippedSteps.length > 0 ? skippedSteps : undefined,
      note: SIMULATION_NOTE,
    };
  } catch (err) {
    const raw =
      err instanceof Error ? err.message : "Unknown simulation error";
    return {
      gasEstimateSucceeded: false,
      error: `Simulation failed on step "${first.step}": ${sanitizeRpcError(raw)}`,
      skippedSteps: skippedSteps.length > 0 ? skippedSteps : undefined,
      note: SIMULATION_NOTE,
    };
  }
}
