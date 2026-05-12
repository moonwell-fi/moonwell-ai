import { describe, it, expect } from "vitest";
import type { Address, PublicClient, Transport, Chain } from "viem";
import { toBaseUnits } from "../lib/amount.js";
import { prepareLendAction } from "../lib/prepare.js";

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
      if (opts.estimateGasShouldThrow) throw new Error("revert: mock");
      return opts.gas ?? 200_000n;
    },
  } as unknown as PublicClient<Transport, Chain>;
}

const USDC: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const M_USDC: Address = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22";
const DEAD: Address = "0x000000000000000000000000000000000000dEaD";

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
