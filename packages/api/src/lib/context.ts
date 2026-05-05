import type { Env } from "../env.js";
import { resolveChain } from "./chains.js";
import { usage } from "./errors.js";
import { rpcFor, makeMoonwellClient } from "./moonwell.js";
import { getViemClient } from "./client.js";

/**
 * Resolve chain from a query string param + bind RPC clients from worker env.
 */
export function setupChain(env: Env, chainParam: string | undefined) {
  const chain = resolveChain(chainParam ?? "base");
  const rpcs = { base: env.BASE_RPC_URL, optimism: env.OPTIMISM_RPC_URL };

  if (!rpcs.base || !rpcs.optimism) {
    throw new Error(
      "Worker is misconfigured: missing BASE_RPC_URL or OPTIMISM_RPC_URL secret.",
    );
  }

  return {
    chain,
    rpcUrl: rpcFor(chain, rpcs),
    viemClient: getViemClient(chain, rpcFor(chain, rpcs)),
    sdkClient: makeMoonwellClient(rpcs),
  };
}

/** Validate a 0x-prefixed Ethereum address from a path param. */
export function requireAddress(value: string | undefined, paramName = "address"): `0x${string}` {
  if (!value) throw usage(`Missing ${paramName}`);
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw usage(`Invalid ${paramName}: ${value}`);
  }
  return value.toLowerCase() as `0x${string}`;
}

/**
 * Parse an optional positive integer query param. Throws a USAGE error on
 * non-numeric or negative input rather than silently producing an empty result
 * (which is what `slice(0, NaN)` and friends would otherwise do).
 */
export function parsePositiveInt(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0 || String(n) !== value.trim()) {
    throw usage(`Invalid ${name}: "${value}" (expected non-negative integer)`);
  }
  return n;
}

/** Parse an optional non-negative float query param. Throws on bad input. */
export function parseNonNegativeFloat(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0) {
    throw usage(`Invalid ${name}: "${value}" (expected non-negative number)`);
  }
  return n;
}

interface PrepareBody {
  chain?: string;
  asset?: string;
  amount?: string;
  amountDecimal?: string;
  from?: string;
  poolAddress?: string;
  simulate?: boolean;
}

export function parsePrepareBody(body: unknown): Required<Pick<PrepareBody, "chain" | "asset" | "from">> & PrepareBody {
  if (typeof body !== "object" || body === null) {
    throw usage("Request body must be JSON");
  }
  const b = body as PrepareBody;
  if (!b.chain) throw usage("`chain` is required");
  if (!b.asset) throw usage("`asset` is required");
  if (!b.from || !/^0x[a-fA-F0-9]{40}$/.test(b.from)) {
    throw usage("`from` must be a valid 0x-prefixed Ethereum address");
  }
  if (!b.amount && !b.amountDecimal) {
    throw usage("Provide `amount` (base units string) or `amountDecimal` (e.g. \"100\")");
  }
  return { ...b, chain: b.chain, asset: b.asset, from: b.from };
}

export type ChainContext = ReturnType<typeof setupChain>;
