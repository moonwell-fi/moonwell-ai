import { describe, it, expect } from "vitest";
import type { Address, PublicClient, Transport, Chain } from "viem";
import { toBaseUnits } from "../lib/amount.js";
import {
  prepareLendAction,
  resolveAssetForLend,
  type MarketForResolution,
} from "../lib/prepare.js";

const FAKE_BASE_USDC: MarketForResolution = {
  underlyingToken: {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  marketToken: {
    symbol: "mUSDC",
    address: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
  },
};

const FAKE_BASE_ETH: MarketForResolution = {
  // The SDK reports the mWETH market's underlying as "ETH" with the zero
  // address. resolveAssetForLend must rewrite this for on-chain use.
  underlyingToken: {
    symbol: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  marketToken: {
    symbol: "mWETH",
    address: "0x628ff693426583D9a7FB391E54366292F509D457",
  },
};

describe("resolveAssetForLend", () => {
  const markets = [FAKE_BASE_USDC, FAKE_BASE_ETH];

  it("resolves USDC to its canonical address", () => {
    const r = resolveAssetForLend(markets, 8453, "USDC", "Base");
    expect(r.assetAddress).toBe(
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    );
    expect(r.assetSymbol).toBe("USDC");
    expect(r.assetDecimals).toBe(6);
  });

  it("accepts case-insensitive symbol", () => {
    expect(
      resolveAssetForLend(markets, 8453, "usdc", "Base").assetSymbol,
    ).toBe("USDC");
  });

  it("asset=ETH swaps zero address for the WETH ERC-20 predeploy", () => {
    const r = resolveAssetForLend(markets, 8453, "ETH", "Base");
    expect(r.assetAddress.toLowerCase()).toBe(
      "0x4200000000000000000000000000000000000006",
    );
    expect(r.assetSymbol).toBe("WETH");
  });

  it("asset=WETH (alias) resolves to the same ETH market with real WETH address", () => {
    const r = resolveAssetForLend(markets, 8453, "WETH", "Base");
    expect(r.assetAddress.toLowerCase()).toBe(
      "0x4200000000000000000000000000000000000006",
    );
    expect(r.assetSymbol).toBe("WETH");
  });

  it("throws USAGE when asset is not in markets", () => {
    expect(() =>
      resolveAssetForLend(markets, 8453, "FAKE", "Base"),
    ).toThrow(/Asset "FAKE" not found/);
  });
});

describe("prepare transaction structure", () => {
  it("supply amount encoding is correct for USDC (6 decimals)", () => {
    const amount = toBaseUnits("100", 6);
    expect(amount).toBe(100_000_000n);
  });

  it("supply amount encoding is correct for WETH (18 decimals)", () => {
    const amount = toBaseUnits("1.5", 18);
    expect(amount).toBe(1_500_000_000_000_000_000n);
  });

  it("small USDC amount", () => {
    const amount = toBaseUnits("0.01", 6);
    expect(amount).toBe(10_000n);
  });
});

// Minimal stub: only the three methods prepareLendAction touches. Cast
// through `unknown` so we don't have to satisfy viem's full PublicClient
// interface for unit tests.
function mockViemClient(opts: {
  allowance?: bigint;
  isMember?: boolean;
  gas?: bigint;
  estimateGasShouldThrow?: boolean;
}): PublicClient<Transport, Chain> {
  return {
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === "allowance") return opts.allowance ?? 0n;
      if (functionName === "checkMembership") return opts.isMember ?? false;
      throw new Error(`unexpected readContract: ${functionName}`);
    },
    estimateGas: async () => {
      if (opts.estimateGasShouldThrow) {
        // Mimic viem's error shape: includes RPC URL + multi-line stack.
        throw new Error(
          "HTTP request failed.\n\nURL: https://invalid-rpc.test/\nRequest body: {}\nVersion: viem@2.47.12",
        );
      }
      return opts.gas ?? 200_000n;
    },
  } as unknown as PublicClient<Transport, Chain>;
}

const USDC: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const M_USDC: Address = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22";
const DEAD: Address = "0x000000000000000000000000000000000000dEaD";

describe("PrepareResult.preconditions[]", () => {
  it("supply emits structured balance + gas preconditions", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n, // skip approval
      isMember: true,
      gas: 200_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 100_000_000n,
      amountDecimal: "100",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: false,
    });
    expect(Array.isArray(result.preconditions)).toBe(true);
    const balance = result.preconditions.find((p) => p.type === "balance");
    expect(balance).toMatchObject({
      type: "balance",
      asset: "USDC",
      assetAddress: USDC,
      min: "100000000",
      minDecimal: "100",
    });
    const gas = result.preconditions.find((p) => p.type === "gas");
    expect(gas).toMatchObject({ type: "gas", transactionCount: 1 });
  });

  it("borrow emits collateral-entered + health-factor + gas", async () => {
    const viemClient = mockViemClient({ gas: 200_000n });
    const result = await prepareLendAction({
      verb: "borrow",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: false,
    });
    const types = result.preconditions.map((p) => p.type).sort();
    expect(types).toEqual(["collateral-entered", "gas", "health-factor"]);
  });

  it("withdraw emits mtoken-balance precondition", async () => {
    const viemClient = mockViemClient({ gas: 200_000n });
    const result = await prepareLendAction({
      verb: "withdraw",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: false,
    });
    const mt = result.preconditions.find((p) => p.type === "mtoken-balance");
    expect(mt).toMatchObject({
      type: "mtoken-balance",
      mToken: M_USDC,
      minUnderlying: "1000000",
      minUnderlyingDecimal: "1",
    });
  });
});

describe("SimulationResult shape", () => {
  it("uses gasEstimateSucceeded (not legacy `success`)", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n,
      isMember: true,
      gas: 200_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: true,
    });
    expect(result.simulation).toBeDefined();
    expect(result.simulation).toHaveProperty("gasEstimateSucceeded", true);
    expect(result.simulation).not.toHaveProperty("success");
    expect(result.simulation?.note).toMatch(/Compound v2|business-logic/i);
  });

  it("sanitizes viem URLs out of simulation.error on failure", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n,
      isMember: true,
      estimateGasShouldThrow: true,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: true,
    });
    expect(result.simulation?.gasEstimateSucceeded).toBe(false);
    expect(result.simulation?.error ?? "").not.toMatch(/https?:\/\//);
  });
});

describe("UnsignedTx.value formatting (EIP-5792)", () => {
  it("all transactions emit 0x-prefixed hex `value`", async () => {
    const viemClient = mockViemClient({
      allowance: 0n, // forces approval step to be included
      isMember: false, // forces enter-market step to be included
      gas: 250_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: false,
    });
    expect(result.transactions.length).toBeGreaterThanOrEqual(3);
    for (const tx of result.transactions) {
      expect(tx.value).toMatch(/^0x[0-9a-f]+$/);
    }
  });
});

describe("WETH/ETH warning emission", () => {
  it("emits WETH warning when asset='WETH'", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n,
      isMember: true,
      gas: 200_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "WETH",
      assetAddress: "0x4200000000000000000000000000000000000006",
      assetDecimals: 18,
      amount: 1_000_000_000_000_000n,
      amountDecimal: "0.001",
      from: DEAD,
      mToken: "0x628ff693426583D9a7FB391E54366292F509D457",
      viemClient,
      simulate: false,
    });
    expect(result.warnings.some((w) => /WETH|wrap/i.test(w))).toBe(true);
  });

  it("emits WETH warning when asset='ETH' (SDK's symbol for mWETH market)", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n,
      isMember: true,
      gas: 200_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "ETH",
      assetAddress: "0x4200000000000000000000000000000000000006",
      assetDecimals: 18,
      amount: 1_000_000_000_000_000n,
      amountDecimal: "0.001",
      from: DEAD,
      mToken: "0x628ff693426583D9a7FB391E54366292F509D457",
      viemClient,
      simulate: false,
    });
    expect(result.warnings.some((w) => /WETH|wrap/i.test(w))).toBe(true);
  });

  it("does not emit WETH warning for USDC", async () => {
    const viemClient = mockViemClient({
      allowance: 2n ** 256n - 1n,
      isMember: true,
      gas: 200_000n,
    });
    const result = await prepareLendAction({
      verb: "supply",
      chainId: 8453,
      asset: "USDC",
      assetAddress: USDC,
      assetDecimals: 6,
      amount: 1_000_000n,
      amountDecimal: "1",
      from: DEAD,
      mToken: M_USDC,
      viemClient,
      simulate: false,
    });
    expect(result.warnings.some((w) => /WETH/.test(w))).toBe(false);
  });
});
