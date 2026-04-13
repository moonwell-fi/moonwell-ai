import { describe, it, expect } from "vitest";
import { envelope, errorEnvelope, isJsonMode } from "../lib/output.js";

describe("envelope", () => {
  it("builds success envelope with correct shape", () => {
    const result = envelope("markets", 8453, [{ asset: "USDC" }]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([{ asset: "USDC" }]);
    expect(result.meta.command).toBe("markets");
    expect(result.meta.chain).toBe("eip155:8453");
    expect(result.meta.timestamp).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("builds error envelope", () => {
    const result = errorEnvelope("supply", 8453, "Insufficient balance");
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBe("Insufficient balance");
    expect(result.meta.command).toBe("supply");
  });
});

describe("isJsonMode", () => {
  it("returns true when flag is set", () => {
    expect(isJsonMode(true)).toBe(true);
  });

  it("returns false when flag is false and TTY", () => {
    // In test environment, isTTY is typically undefined/false
    expect(isJsonMode(false)).toBe(!process.stdout.isTTY);
  });
});
