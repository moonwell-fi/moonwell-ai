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

  it("accepts a body without chain (defaults to base downstream)", () => {
    const parsed = parsePrepareBody({
      asset: "USDC",
      amountDecimal: "1",
      from: "0x000000000000000000000000000000000000dEaD",
    });
    expect(parsed.chain).toBeUndefined();
    expect(parsed.asset).toBe("USDC");
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

  it("rejects missing asset", () => {
    expect(() =>
      parsePrepareBody({
        chain: "base",
        amountDecimal: "1",
        from: "0x000000000000000000000000000000000000dEaD",
      }),
    ).toThrow("`asset` is required");
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

describe("prepare body validation — hardened inputs", () => {
  const valid = {
    chain: "base",
    asset: "USDC",
    from: "0x000000000000000000000000000000000000dEaD",
  };

  it("rejects amountDecimal as a JSON number", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: 0.1 }),
    ).toThrow(/amountDecimal.*string/i);
  });

  it("rejects scientific notation in amountDecimal", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: "1e3" }),
    ).toThrow(/amountDecimal/);
  });

  it("rejects negative amountDecimal", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: "-1" }),
    ).toThrow(/amountDecimal/);
  });

  it("rejects amountDecimal with a leading dot", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: ".5" }),
    ).toThrow(/amountDecimal/);
  });

  it("rejects non-string amount", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amount: 1000 as unknown as string }),
    ).toThrow(/amount.*string/i);
  });

  it("rejects amount with a decimal point", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amount: "1.5" }),
    ).toThrow(/amount/);
  });

  it("rejects amount with leading whitespace", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amount: " 100" }),
    ).toThrow(/amount/);
  });

  it("rejects negative amount", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amount: "-100" }),
    ).toThrow(/amount/);
  });

  it("rejects amount with leading zero (other than just '0')", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amount: "0100" }),
    ).toThrow(/amount/);
  });

  it("rejects amount: '0' (zero-value tx is a footgun)", () => {
    expect(() => parsePrepareBody({ ...valid, amount: "0" })).toThrow(
      /amount/,
    );
  });

  it("rejects amountDecimal: '0'", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: "0" }),
    ).toThrow(/amountDecimal/);
  });

  it("rejects amountDecimal: '0.0'", () => {
    expect(() =>
      parsePrepareBody({ ...valid, amountDecimal: "0.0" }),
    ).toThrow(/amountDecimal/);
  });

  it("accepts amountDecimal: '0.5' (less than one whole unit)", () => {
    const parsed = parsePrepareBody({ ...valid, amountDecimal: "0.5" });
    expect(parsed.amountDecimal).toBe("0.5");
  });

  it("accepts amountDecimal: '0.000001' (smallest USDC unit)", () => {
    const parsed = parsePrepareBody({ ...valid, amountDecimal: "0.000001" });
    expect(parsed.amountDecimal).toBe("0.000001");
  });

  it("rejects both amount and amountDecimal together", () => {
    expect(() =>
      parsePrepareBody({
        ...valid,
        amount: "1000000",
        amountDecimal: "1",
      }),
    ).toThrow(/either.*amount.*amountDecimal|both/i);
  });

  it("rejects non-boolean simulate", () => {
    expect(() =>
      parsePrepareBody({
        ...valid,
        amountDecimal: "1",
        simulate: "yes" as unknown as boolean,
      }),
    ).toThrow(/simulate/i);
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
