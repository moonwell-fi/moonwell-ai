import type { Envelope } from "./types.js";
import { caip2 } from "./chains.js";

/**
 * Build a JSON envelope. Matches the CLI's `envelope()` shape so callers can
 * use the same parser whether they hit the API or pipe CLI output.
 */
export function envelope<T>(
  command: string,
  chainId: number,
  data: T,
): Envelope<T> {
  return {
    success: true,
    data,
    meta: {
      command,
      chain: caip2(chainId),
      timestamp: new Date().toISOString(),
    },
  };
}

/** Build an error envelope. */
export function errorEnvelope(
  command: string,
  chainId: number,
  error: string,
): Envelope<null> {
  return {
    success: false,
    data: null,
    meta: {
      command,
      chain: caip2(chainId),
      timestamp: new Date().toISOString(),
    },
    error,
  };
}

/**
 * BigInt-safe JSON serializer for envelope payloads. SDK responses sometimes
 * contain bigints (block numbers, balances); JSON.stringify chokes on them.
 */
export function stringify(value: unknown, pretty = false): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    pretty ? 2 : undefined,
  );
}
