import { describe, it, expect } from "vitest";
import { resolveChain, caip2 } from "../src/lib/chains.js";

describe("resolveChain", () => {
  it("resolves 'base'", () => {
    const chain = resolveChain("base");
    expect(chain.chainId).toBe(8453);
    expect(chain.networkName).toBe("base");
  });

  it("resolves '8453'", () => {
    const chain = resolveChain("8453");
    expect(chain.chainId).toBe(8453);
  });

  it("resolves 'optimism'", () => {
    const chain = resolveChain("optimism");
    expect(chain.chainId).toBe(10);
  });

  it("resolves 'op'", () => {
    const chain = resolveChain("op");
    expect(chain.chainId).toBe(10);
  });

  it("resolves CAIP-2 identifier", () => {
    expect(resolveChain("eip155:8453").chainId).toBe(8453);
    expect(resolveChain("eip155:10").chainId).toBe(10);
  });

  it("throws for unsupported chain", () => {
    expect(() => resolveChain("ethereum")).toThrow("Unsupported chain");
  });
});

describe("caip2", () => {
  it("formats CAIP-2 identifier", () => {
    expect(caip2(8453)).toBe("eip155:8453");
    expect(caip2(10)).toBe("eip155:10");
  });
});
