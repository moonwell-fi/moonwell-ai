import { describe, it, expect } from "vitest";
import { toBaseUnits } from "../src/lib/amount.js";
import { parsePrepareBody } from "../src/lib/context.js";

describe("prepare body validation", () => {
  it("accepts a well-formed body", () => {
    const parsed = parsePrepareBody({
      chain: "base",
      asset: "USDC",
      amountDecimal: "100",
      from: "0x000000000000000000000000000000000000dEaD",
    });
    expect(parsed.asset).toBe("USDC");
    expect(parsed.amountDecimal).toBe("100");
  });

  it("rejects missing chain", () => {
    expect(() =>
      parsePrepareBody({
        asset: "USDC",
        amountDecimal: "1",
        from: "0x000000000000000000000000000000000000dEaD",
      }),
    ).toThrow("`chain` is required");
  });

  it("rejects bad from address", () => {
    expect(() =>
      parsePrepareBody({
        chain: "base",
        asset: "USDC",
        amountDecimal: "1",
        from: "not-a-hex",
      }),
    ).toThrow("`from` must be a valid 0x-prefixed Ethereum address");
  });

  it("rejects missing amount", () => {
    expect(() =>
      parsePrepareBody({
        chain: "base",
        asset: "USDC",
        from: "0x000000000000000000000000000000000000dEaD",
      }),
    ).toThrow(/Provide `amount`/);
  });
});

describe("amount encoding for prepare", () => {
  it("USDC (6 decimals) — 100 → 100_000_000", () => {
    expect(toBaseUnits("100", 6)).toBe(100_000_000n);
  });

  it("WETH (18 decimals) — 1.5 → 1.5e18", () => {
    expect(toBaseUnits("1.5", 18)).toBe(1_500_000_000_000_000_000n);
  });

  it("small USDC — 0.01 → 10_000", () => {
    expect(toBaseUnits("0.01", 6)).toBe(10_000n);
  });
});
