import { describe, it, expect } from "vitest";
import { envelope, errorEnvelope, stringify } from "../src/lib/json-output.js";

describe("envelope", () => {
  it("builds an ok envelope", () => {
    const e = envelope("markets", 8453, [{ asset: "USDC" }]);
    expect(e.success).toBe(true);
    expect(e.data).toEqual([{ asset: "USDC" }]);
    expect(e.meta.command).toBe("markets");
    expect(e.meta.chain).toBe("eip155:8453");
    expect(typeof e.meta.timestamp).toBe("string");
  });

  it("meta.chain is null when chainId is 0", () => {
    const e = envelope("markets", 0, []);
    expect(e.meta.chain).toBeNull();
  });

  it("meta.chain is null when chainId is null", () => {
    const e = envelope("markets", null, []);
    expect(e.meta.chain).toBeNull();
  });
});

describe("errorEnvelope", () => {
  it("builds an error envelope", () => {
    const e = errorEnvelope("markets", 8453, "RPC down");
    expect(e.success).toBe(false);
    expect(e.data).toBeNull();
    expect(e.error).toBe("RPC down");
  });

  it("meta.chain is null when chainId unresolved", () => {
    const e = errorEnvelope("markets", null, "bad input");
    expect(e.meta.chain).toBeNull();
  });
});

describe("stringify", () => {
  it("serializes bigints to strings", () => {
    const json = stringify({ balance: 12345678901234567890n });
    expect(json).toBe('{"balance":"12345678901234567890"}');
  });

  it("pretty-prints when asked", () => {
    const json = stringify({ a: 1 }, true);
    expect(json).toBe('{\n  "a": 1\n}');
  });
});
