import { Hono } from "hono";
import type { Env } from "../env.js";
import { setupChain } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";

const READ_CACHE_SECONDS = 30;

const markets = new Hono<{ Bindings: Env }>();

function utilization(m: { totalSupplyUsd: number; totalBorrowsUsd: number }): number {
  return m.totalSupplyUsd > 0 ? m.totalBorrowsUsd / m.totalSupplyUsd : 0;
}

function marketToJson(m: any): Record<string, unknown> {
  return {
    asset: m.underlyingToken.symbol,
    assetAddress: m.underlyingToken.address,
    mToken: m.marketToken.symbol,
    mTokenAddress: m.marketToken.address,
    baseSupplyApy: m.baseSupplyApy,
    baseBorrowApy: m.baseBorrowApy,
    totalSupplyApr: m.totalSupplyApr,
    totalBorrowApr: m.totalBorrowApr,
    totalSupplyUsd: m.totalSupplyUsd,
    totalBorrowsUsd: m.totalBorrowsUsd,
    liquidityUsd: m.totalSupplyUsd - m.totalBorrowsUsd,
    utilization: utilization(m),
    collateralFactor: m.collateralFactor,
  };
}

/** GET /v1/markets?chain=…[&asset=…&sort=…&limit=…] */
markets.get("/", async (c) => {
  let chainId = 0;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;

    const list = await sdkClient.getMarkets({ chainId: chain.chainId });
    let filtered = [...list];

    const asset = c.req.query("asset");
    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (m: any) =>
          m.underlyingToken.symbol.toUpperCase() === sym ||
          m.marketToken.symbol.toUpperCase() === sym,
      );
    }

    const sortKey = c.req.query("sort") ?? "tvl";
    filtered.sort((a: any, b: any) => {
      switch (sortKey) {
        case "supply-apy":
          return b.baseSupplyApy - a.baseSupplyApy;
        case "borrow-apy":
          return a.baseBorrowApy - b.baseBorrowApy;
        default:
          return b.totalSupplyUsd - a.totalSupplyUsd;
      }
    });

    const limit = c.req.query("limit");
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit, 10));
    }

    return ok(c, "markets", chain.chainId, filtered.map(marketToJson), {
      cacheSeconds: READ_CACHE_SECONDS,
    });
  } catch (err) {
    return fail(c, "markets", chainId, err);
  }
});

/** GET /v1/markets/:id?chain=…  (id = symbol or mToken/underlying address) */
markets.get("/:id", async (c) => {
  let chainId = 0;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const id = c.req.param("id");

    const list = await sdkClient.getMarkets({ chainId: chain.chainId });
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(id);
    const idLower = id.toLowerCase();
    const sym = id.toUpperCase();

    const market = list.find((m: any) => {
      if (isAddress) {
        return (
          m.underlyingToken.address.toLowerCase() === idLower ||
          m.marketToken.address.toLowerCase() === idLower
        );
      }
      return (
        m.underlyingToken.symbol.toUpperCase() === sym ||
        m.marketToken.symbol.toUpperCase() === sym
      );
    });

    if (!market) {
      return fail(
        c,
        "markets",
        chain.chainId,
        new Error(`Market "${id}" not found on ${chain.name}`),
      );
    }

    return ok(c, "markets", chain.chainId, marketToJson(market), {
      cacheSeconds: READ_CACHE_SECONDS,
    });
  } catch (err) {
    return fail(c, "markets", chainId, err);
  }
});

export default markets;
