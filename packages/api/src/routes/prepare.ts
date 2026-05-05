import { Hono } from "hono";
import { getAddress, type Address } from "viem";
import type { Env } from "../env.js";
import { setupChain, parsePrepareBody } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";
import { resolveMToken } from "../lib/mtoken-resolver.js";
import { prepareLendAction } from "../lib/prepare.js";
import { toBaseUnits, toDecimal } from "../lib/amount.js";
import { usage } from "../lib/errors.js";
import type { LendVerb } from "../lib/types.js";

const prepare = new Hono<{ Bindings: Env }>();

const VERBS: ReadonlySet<LendVerb> = new Set(["supply", "withdraw", "borrow", "repay"]);

/** POST /v1/prepare/:verb */
prepare.post("/:verb", async (c) => {
  const verbParam = c.req.param("verb");
  let chainId = 0;
  try {
    if (!VERBS.has(verbParam as LendVerb)) {
      throw usage(`Unknown verb "${verbParam}". Supported: supply, withdraw, borrow, repay`);
    }
    const verb = verbParam as LendVerb;

    const body = await c.req.json().catch(() => {
      throw usage("Request body must be valid JSON");
    });
    const parsed = parsePrepareBody(body);

    const { chain, sdkClient, viemClient } = setupChain(c.env, parsed.chain);
    chainId = chain.chainId;

    const markets = await sdkClient.getMarkets({ chainId: chain.chainId });
    const market = markets.find(
      (m) => m.underlyingToken.symbol.toUpperCase() === parsed.asset.toUpperCase(),
    );
    if (!market) {
      throw usage(
        `Asset "${parsed.asset}" not found in Moonwell markets on ${chain.name}`,
      );
    }

    const assetAddress = getAddress(market.underlyingToken.address) as Address;
    const assetDecimals = market.underlyingToken.decimals as number;
    const assetSymbol = market.underlyingToken.symbol as string;

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

    return ok(c, `prepare.${verb}`, chain.chainId, result);
  } catch (err) {
    return fail(c, `prepare.${verbParam}`, chainId, err);
  }
});

export default prepare;
