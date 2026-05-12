import { describe, it, expect } from "vitest";
import {
  isDeprecatedMarket,
  getWethAddress,
  ZERO_ADDRESS,
} from "../src/lib/contracts.js";

describe("isDeprecatedMarket", () => {
  it("flags Base mUSDbC as deprecated", () => {
    expect(
      isDeprecatedMarket(8453, "0x703843C3379b52F9FF486c9f5892218d2a065cC8"),
    ).toBe(true);
  });

  it("flags Base mUSDbC as deprecated (case-insensitive)", () => {
    expect(
      isDeprecatedMarket(8453, "0x703843c3379b52f9ff486c9f5892218d2a065cc8"),
    ).toBe(true);
  });

  it("does NOT flag canonical Base mUSDC", () => {
    expect(
      isDeprecatedMarket(8453, "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22"),
    ).toBe(false);
  });

  it("returns false for unknown chain ids", () => {
    expect(isDeprecatedMarket(1, "0x703843C3379b52F9FF486c9f5892218d2a065cC8"))
      .toBe(false);
  });
});

describe("getWethAddress", () => {
  it("returns the Base WETH predeploy", () => {
    expect(getWethAddress(8453).toLowerCase()).toBe(
      "0x4200000000000000000000000000000000000006",
    );
  });

  it("returns the Optimism WETH predeploy", () => {
    expect(getWethAddress(10).toLowerCase()).toBe(
      "0x4200000000000000000000000000000000000006",
    );
  });

  it("throws on unknown chain", () => {
    expect(() => getWethAddress(99)).toThrow(/No WETH/);
  });
});

describe("ZERO_ADDRESS", () => {
  it("is the canonical 0x000…0 form", () => {
    expect(ZERO_ADDRESS).toBe("0x0000000000000000000000000000000000000000");
  });
});
