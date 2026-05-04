import {
  encodeFunctionData,
  type Address,
  type PublicClient,
  type Transport,
  type Chain,
} from "viem";
import { mTokenAbi, comptrollerAbi, erc20Abi } from "./abis.js";
import { getContracts } from "./contracts.js";
import type {
  LendVerb,
  PrepareResult,
  UnsignedTx,
  SimulationResult,
} from "./types.js";
import { caip2 } from "./chains.js";

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
  const warnings: string[] = [];

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
        value: "0",
        chainId,
      });

      requirements.push(`Sufficient ${asset} balance`, `Gas for ${transactions.length} transaction(s)`);

      if (asset.toUpperCase() === "WETH") {
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
        value: "0",
        chainId,
      });

      requirements.push(
        `Sufficient mToken balance to redeem ${amountDecimal} ${asset}`,
        "Gas for 1 transaction",
      );

      if (asset.toUpperCase() === "WETH") {
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
        value: "0",
        chainId,
      });

      requirements.push(
        "Sufficient collateral deposited and market entered",
        "Account health factor must remain above 1.0 after borrow",
        "Gas for 1 transaction",
      );

      if (asset.toUpperCase() === "WETH") {
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
        value: "0",
        chainId,
      });

      requirements.push(`Sufficient ${asset} balance`, `Gas for ${transactions.length} transaction(s)`);

      if (asset.toUpperCase() === "WETH") {
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
      value: "0",
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
      value: "0",
      chainId,
    });
  }
}

async function simulateTransactions(
  viemClient: PublicClient<Transport, Chain>,
  transactions: UnsignedTx[],
  from: Address,
): Promise<SimulationResult> {
  // Only simulate the first step. Steps 2+ depend on prior steps being
  // on-chain (e.g., mint depends on approve), so independent simulation
  // would always fail and produce misleading results.
  if (transactions.length === 0) {
    return { success: true, gasEstimate: "0" };
  }

  const first = transactions[0];
  const skippedSteps = transactions.slice(1).map((tx) => tx.step);

  try {
    const gas = await viemClient.estimateGas({
      account: from,
      to: first.to,
      data: first.data,
      value: BigInt(first.value),
    });
    return {
      success: true,
      gasEstimate: gas.toString(),
      skippedSteps: skippedSteps.length > 0 ? skippedSteps : undefined,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown simulation error";
    return {
      success: false,
      error: `Simulation failed on step "${first.step}": ${message}`,
      skippedSteps: skippedSteps.length > 0 ? skippedSteps : undefined,
    };
  }
}
