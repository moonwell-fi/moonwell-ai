import { describe, it, expect } from "vitest";
import { toBaseUnits, toDecimal, formatUsd, formatPct } from "../src/lib/amount.js";

describe("toBaseUnits", () => {
  it("converts whole number", () => {
    expect(toBaseUnits("100", 6)).toBe(100_000_000n);
  });

  it("converts decimal", () => {
    expect(toBaseUnits("1.5", 6)).toBe(1_500_000n);
  });

  it("truncates excess decimals", () => {
    expect(toBaseUnits("1.1234567", 6)).toBe(1_123_456n);
  });

  it("handles no fractional part", () => {
    expect(toBaseUnits("42", 18)).toBe(42_000_000_000_000_000_000n);
  });
});

describe("toDecimal", () => {
  it("converts base units to decimal", () => {
    expect(toDecimal(1_500_000n, 6)).toBe("1.5");
  });

  it("handles whole numbers", () => {
    expect(toDecimal(100_000_000n, 6)).toBe("100");
  });

  it("handles small amounts", () => {
    expect(toDecimal(1n, 6)).toBe("0.000001");
  });
});

describe("formatUsd", () => {
  it("formats billions", () => {
    expect(formatUsd(1_234_567_890)).toBe("$1.2B");
  });

  it("formats millions", () => {
    expect(formatUsd(124_500_000)).toBe("$124.5M");
  });

  it("formats thousands", () => {
    expect(formatUsd(5_400)).toBe("$5.4K");
  });

  it("formats small values", () => {
    expect(formatUsd(42.5)).toBe("$42.50");
  });
});

describe("formatPct", () => {
  it("formats percentage", () => {
    expect(formatPct(3.42)).toBe("3.42%");
  });

  it("formats zero", () => {
    expect(formatPct(0)).toBe("0.00%");
  });
});
