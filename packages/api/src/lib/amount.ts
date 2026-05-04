/**
 * Convert a human-readable decimal string to base units given token decimals.
 * e.g. "1.5" with 6 decimals → "1500000"
 */
export function toBaseUnits(decimal: string, decimals: number): bigint {
  const parts = decimal.split(".");
  const whole = parts[0] ?? "0";
  let frac = parts[1] ?? "";

  if (frac.length > decimals) {
    frac = frac.slice(0, decimals);
  } else {
    frac = frac.padEnd(decimals, "0");
  }

  return BigInt(whole + frac);
}

/**
 * Convert base units to a human-readable decimal string.
 * e.g. 1500000n with 6 decimals → "1.500000"
 */
export function toDecimal(baseUnits: bigint, decimals: number): string {
  const str = baseUnits.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, str.length - decimals);
  const frac = str.slice(str.length - decimals);
  const trimmedFrac = frac.replace(/0+$/, "");
  return trimmedFrac ? `${whole}.${trimmedFrac}` : whole;
}

/**
 * Format a USD value for display (e.g. 1234567.89 → "$1,234,567.89").
 */
export function formatUsd(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format a percentage for display (e.g. 3.4256 → "3.43%").
 */
export function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}
