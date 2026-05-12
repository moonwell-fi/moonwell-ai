import { Hono } from "hono";
import type { Market } from "@moonwell-fi/moonwell-sdk";
import type { Env } from "../env.js";
import { setupChain, parsePositiveInt, parseNonNegativeFloat } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";

const READ_CACHE_SECONDS = 30;

const yieldRoute = new Hono<{ Bindings: Env }>();

/** GET /v1/yield?chain=…[&asset=…&min-tvl=…&sort=apy|tvl&limit=…] */
yieldRoute.get("/", async (c) => {
  let chainId: number | null = null;
  try {
    // Validate inputs before touching RPC — fail fast on bad params.
    const limit = parsePositiveInt(c.req.query("limit"), "limit");
    const minTvl = parseNonNegativeFloat(c.req.query("min-tvl"), "min-tvl");
    const sortKey = c.req.query("sort") ?? "apy";
    const asset = c.req.query("asset");

    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;

    const markets = await sdkClient.getMarkets({ chainId: chain.chainId });
    let filtered = [...markets];

    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (m) => m.underlyingToken.symbol.toUpperCase() === sym,
      );
    }

    if (minTvl !== undefined) {
      filtered = filtered.filter((m) => m.totalSupplyUsd >= minTvl);
    }

    filtered.sort((a, b) =>
      sortKey === "tvl"
        ? b.totalSupplyUsd - a.totalSupplyUsd
        : b.baseSupplyApy - a.baseSupplyApy,
    );

    if (limit !== undefined) {
      filtered = filtered.slice(0, limit);
    }

    return ok(
      c,
      "yield",
      chain.chainId,
      filtered.map((m: Market) => ({
        asset: m.underlyingToken.symbol,
        assetAddress: m.underlyingToken.address,
        baseSupplyApy: m.baseSupplyApy,
        totalSupplyApr: m.totalSupplyApr,
        totalSupplyUsd: m.totalSupplyUsd,
        collateralFactor: m.collateralFactor,
      })),
      { cacheSeconds: READ_CACHE_SECONDS },
    );
  } catch (err) {
    return fail(c, "yield", chainId, err);
  }
});

export default yieldRoute;
