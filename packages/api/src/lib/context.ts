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

/** Parse "true"/"false"/undefined query value. Throws USAGE on anything else. */
export function parseBoolQuery(
  value: string | undefined,
  name: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw usage(`Invalid ${name}: "${value}" (expected "true" or "false")`);
}

/**
 * Accept only values in `allowed`. Returns the value (with `defaultValue`
 * applied) or throws USAGE listing the legal options. Use for any query-
 * param enum so unknown inputs fail loudly instead of silently falling
 * back to a default the caller didn't expect.
 */
export function parseEnumQuery<T extends string>(
  value: string | undefined,
  name: string,
  allowed: readonly T[],
  defaultValue: T,
): T {
  if (value === undefined) return defaultValue;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw usage(
    `Invalid ${name}: "${value}" (supported: ${allowed.join(", ")})`,
  );
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

// Tight regexes pin start-to-end, so they forbid scientific notation, sign,
// whitespace, and leading zeros (other than the single-char "0").
const POSITIVE_INTEGER_STR = /^(0|[1-9]\d*)$/;
const POSITIVE_DECIMAL_STR = /^(0|[1-9]\d*)(\.\d+)?$/;

export function parsePrepareBody(
  body: unknown,
): Required<Pick<PrepareBody, "asset" | "from">> & PrepareBody {
  if (typeof body !== "object" || body === null) {
    throw usage("Request body must be JSON");
  }
  const b = body as Record<string, unknown>;

  if (b.asset === undefined || b.asset === null || b.asset === "") {
    throw usage("`asset` is required");
  }
  if (typeof b.asset !== "string") {
    throw usage("`asset` must be a string");
  }

  if (typeof b.from !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(b.from)) {
    throw usage("`from` must be a valid 0x-prefixed Ethereum address");
  }

  if (b.chain !== undefined && typeof b.chain !== "string") {
    throw usage("`chain` must be a string");
  }
  if (b.poolAddress !== undefined && typeof b.poolAddress !== "string") {
    throw usage("`poolAddress` must be a string");
  }
  if (b.simulate !== undefined && typeof b.simulate !== "boolean") {
    throw usage("`simulate` must be a boolean (true or false)");
  }

  const hasAmount =
    b.amount !== undefined && b.amount !== null && b.amount !== "";
  const hasDecimal =
    b.amountDecimal !== undefined &&
    b.amountDecimal !== null &&
    b.amountDecimal !== "";

  if (hasAmount && hasDecimal) {
    throw usage(
      "Provide either `amount` (base units) or `amountDecimal` (human-readable), not both",
    );
  }
  if (!hasAmount && !hasDecimal) {
    throw usage(
      'Provide `amount` (base units string) or `amountDecimal` (e.g. "100")',
    );
  }

  if (hasAmount) {
    if (typeof b.amount !== "string") {
      throw usage('`amount` must be a string (base units, e.g. "1000000")');
    }
    if (!POSITIVE_INTEGER_STR.test(b.amount)) {
      throw usage(
        `Invalid \`amount\`: "${b.amount}" (expected a non-negative integer string — no decimals, no scientific notation, no leading zeros)`,
      );
    }
  }
  if (hasDecimal) {
    if (typeof b.amountDecimal !== "string") {
      throw usage(
        '`amountDecimal` must be a string (e.g. "1.5") — JSON numbers lose precision',
      );
    }
    if (!POSITIVE_DECIMAL_STR.test(b.amountDecimal)) {
      throw usage(
        `Invalid \`amountDecimal\`: "${b.amountDecimal}" (expected a non-negative decimal string like "1" or "1.5", no scientific notation)`,
      );
    }
  }

  return {
    asset: b.asset,
    from: b.from,
    chain: b.chain as string | undefined,
    amount: b.amount as string | undefined,
    amountDecimal: b.amountDecimal as string | undefined,
    poolAddress: b.poolAddress as string | undefined,
    simulate: b.simulate as boolean | undefined,
  };
}

export type ChainContext = ReturnType<typeof setupChain>;
