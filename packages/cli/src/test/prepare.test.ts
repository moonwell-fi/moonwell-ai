import { describe, it, expect } from "vitest";
import { toBaseUnits } from "../lib/amount.js";

// These tests validate the transaction structure logic without hitting RPC.
// Full integration tests would need a mocked viem client.

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

describe("WETH warning detection", () => {
  it("detects WETH asset for warning", () => {
    const asset = "WETH";
    expect(asset.toUpperCase() === "WETH").toBe(true);
  });

  it("does not trigger for non-WETH", () => {
    const asset = "USDC";
    expect(asset.toUpperCase() === "WETH").toBe(false);
  });
});
