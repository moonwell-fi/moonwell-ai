import { describe, it, expect } from "vitest";
import {
  isDeprecatedMarket,
  getWethAddress,
  WETH_ADDRESSES,
  DEPRECATED_MARKETS,
  ZERO_ADDRESS,
} from "../src/lib/contracts.js";
import { SUPPORTED_CHAIN_IDS } from "../src/lib/chains.js";

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

describe("per-chain lookup table parity", () => {
  // Guards against the failure mode: adding a chain to chains.ts without
  // updating WETH_ADDRESSES / DEPRECATED_MARKETS, which would 500 the
  // first time an agent hit /prepare/supply?asset=ETH.

  it.each([...SUPPORTED_CHAIN_IDS])(
    "WETH_ADDRESSES has an entry for chain %i",
    (chainId) => {
      expect(WETH_ADDRESSES[chainId]).toBeDefined();
      expect(WETH_ADDRESSES[chainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    },
  );

  it.each([...SUPPORTED_CHAIN_IDS])(
    "DEPRECATED_MARKETS has an entry for chain %i (empty set is fine)",
    (chainId) => {
      // Undefined would mean a typo in the table; an empty set is valid
      // (no deprecated markets on this chain yet).
      expect(DEPRECATED_MARKETS[chainId]).toBeInstanceOf(Set);
    },
  );
});
