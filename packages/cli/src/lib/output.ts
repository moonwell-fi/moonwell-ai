import type { Envelope } from "./types.js";
import { caip2 } from "./chains.js";
import { c } from "./format.js";

/**
 * Detect whether we should output JSON (piped / --json flag) or pretty text.
 */
export function isJsonMode(jsonFlag?: boolean): boolean {
  if (jsonFlag) return true;
  return !process.stdout.isTTY;
}

/**
 * Build a JSON envelope. `chainId` may be `null` (or `0`) when the envelope
 * fires before chain resolution; in that case `meta.chain` is `null`.
 */
export function envelope<T>(
  command: string,
  chainId: number | null,
  data: T,
): Envelope<T> {
  return {
    success: true,
    data,
    meta: {
      command,
      chain: chainId && chainId > 0 ? caip2(chainId) : null,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Build an error envelope.
 */
export function errorEnvelope(
  command: string,
  chainId: number | null,
  error: string,
): Envelope<null> {
  return {
    success: false,
    data: null,
    meta: {
      command,
      chain: chainId && chainId > 0 ? caip2(chainId) : null,
      timestamp: new Date().toISOString(),
    },
    error,
  };
}

/**
 * Print JSON output.
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print an error to stderr (pretty mode).
 */
export function printError(message: string): void {
  console.error(`${c.error("Error:")} ${message}`);
}

/**
 * Handle a command error — outputs JSON envelope or pretty stderr depending on mode.
 */
export function handleError(
  command: string,
  chainId: number | null,
  err: unknown,
  json: boolean,
): void {
  const message = err instanceof Error ? err.message : String(err);
  if (json) {
    printJson(errorEnvelope(command, chainId, message));
  } else {
    printError(message);
  }
}
