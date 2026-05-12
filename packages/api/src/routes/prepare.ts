import { Hono } from "hono";
import { getAddress, type Address } from "viem";
import type { Env } from "../env.js";
import { setupChain, parsePrepareBody } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";
import { resolveMToken } from "../lib/mtoken-resolver.js";
import { prepareLendAction, resolveAssetForLend } from "../lib/prepare.js";
import { toBaseUnits, toDecimal } from "../lib/amount.js";
import { usage } from "../lib/errors.js";
import type { LendVerb } from "../lib/types.js";

const prepare = new Hono<{ Bindings: Env }>();

const VERBS: ReadonlySet<LendVerb> = new Set(["supply", "withdraw", "borrow", "repay"]);

const QUERY_FIELDS = [
  "chain",
  "asset",
  "amount",
  "amountDecimal",
  "from",
  "poolAddress",
] as const;

// Reshape query-string params into the same flat object that
// `parsePrepareBody` validates, so GET and POST share validation.
// `simulate` is a boolean in JSON bodies but a string in query params.
function bodyFromQuery(query: (name: string) => string | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of QUERY_FIELDS) {
    const v = query(k);
    if (v !== undefined) out[k] = v;
  }
  const sim = query("simulate");
  if (sim !== undefined) {
    if (sim === "true") out.simulate = true;
    else if (sim === "false") out.simulate = false;
    else throw usage(`Invalid simulate: "${sim}" (expected "true" or "false")`);
  }
  return out;
}

async function runPrepare(env: Env, verbParam: string, body: unknown) {
  if (!VERBS.has(verbParam as LendVerb)) {
    throw usage(`Unknown verb "${verbParam}". Supported: supply, withdraw, borrow, repay`);
  }
  const verb = verbParam as LendVerb;
  const parsed = parsePrepareBody(body);

  const { chain, sdkClient, viemClient } = setupChain(env, parsed.chain);

  const markets = await sdkClient.getMarkets({ chainId: chain.chainId });

  const { market, assetAddress, assetDecimals, assetSymbol } =
    resolveAssetForLend(markets, chain.chainId, parsed.asset, chain.name);

  let amount: bigint;
  let amountDecimal: string;
  if (parsed.amount) {
    amount = BigInt(parsed.amount);
    amountDecimal = toDecimal(amount, assetDecimals);
  } else {
    amount = toBaseUnits(parsed.amountDecimal!, assetDecimals);
    amountDecimal = parsed.amountDecimal!;
  }

  // Pass the SDK markets list as hints so we skip the
  // Comptroller.getAllMarkets() + multicall round-trip on the happy path.
  const marketHints = markets.map((m) => ({
    mTokenAddress: getAddress(m.marketToken.address) as Address,
    underlyingAddress: getAddress(m.underlyingToken.address) as Address,
  }));
  const mToken = await resolveMToken(
    viemClient,
    chain.chainId,
    assetAddress,
    parsed.poolAddress,
    marketHints,
  );

  const result = await prepareLendAction({
    verb,
    chainId: chain.chainId,
    asset: assetSymbol,
    assetAddress,
    assetDecimals,
    amount,
    amountDecimal,
    from: getAddress(parsed.from) as Address,
    mToken,
    viemClient,
    simulate: parsed.simulate !== false,
    estimatedAPY: market.baseSupplyApy || undefined,
  });

  return { verb, chain, result };
}

/** POST /v1/prepare/:verb */
prepare.post("/:verb", async (c) => {
  const verbParam = c.req.param("verb");
  let chainId: number | null = null;
  try {
    const body = await c.req.json().catch(() => {
      throw usage("Request body must be valid JSON");
    });
    const { verb, chain, result } = await runPrepare(c.env, verbParam, body);
    chainId = chain.chainId;
    return ok(c, `prepare.${verb}`, chain.chainId, result);
  } catch (err) {
    return fail(c, `prepare.${verbParam}`, chainId, err);
  }
});

/**
 * GET /v1/prepare/:verb
 *
 * Same params and same response envelope as POST, but read from the query
 * string. Useful for harnesses that can only issue GETs. Always returns
 * `Cache-Control: private, no-store` (default in `ok()` when no cache
 * window is set) because each call performs a fresh `eth_estimateGas`
 * tied to live on-chain state.
 */
prepare.get("/:verb", async (c) => {
  const verbParam = c.req.param("verb");
  let chainId: number | null = null;
  try {
    const body = bodyFromQuery((name) => c.req.query(name));
    const { verb, chain, result } = await runPrepare(c.env, verbParam, body);
    chainId = chain.chainId;
    return ok(c, `prepare.${verb}`, chain.chainId, result);
  } catch (err) {
    return fail(c, `prepare.${verbParam}`, chainId, err);
  }
});

export default prepare;
