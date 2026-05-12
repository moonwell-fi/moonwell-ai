import type { Context } from "hono";
import { envelope, errorEnvelope, stringify } from "./json-output.js";
import { MoonwellError, statusFor } from "./errors.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

interface OkOpts {
  /** seconds — sets `Cache-Control: public, max-age=…, s-maxage=…` */
  cacheSeconds?: number;
}

/** Build an ok envelope response with optional edge cache. */
export function ok<T>(
  c: Context,
  command: string,
  chainId: number | null,
  data: T,
  opts: OkOpts = {},
) {
  const headers: Record<string, string> = { ...JSON_HEADERS };
  if (opts.cacheSeconds) {
    headers["cache-control"] = `public, max-age=${opts.cacheSeconds}, s-maxage=${opts.cacheSeconds}`;
  } else {
    headers["cache-control"] = "private, no-store";
  }
  return c.body(stringify(envelope(command, chainId, data)), 200, headers);
}

/** Build an error envelope response with appropriate HTTP status. */
export function fail(
  c: Context,
  command: string,
  chainId: number | null,
  err: unknown,
) {
  const status = statusFor(err);
  const message = err instanceof Error ? err.message : String(err);
  const code =
    err instanceof MoonwellError ? err.code : status >= 500 ? "INTERNAL" : "USAGE";
  // Log unexpected errors — bug if we hit INTERNAL.
  if (status >= 500) {
    console.error(`[${command}] ${code}: ${message}`, err);
  }
  return c.body(
    stringify(errorEnvelope(command, chainId, message)),
    status,
    { ...JSON_HEADERS, "cache-control": "private, no-store" },
  );
}
