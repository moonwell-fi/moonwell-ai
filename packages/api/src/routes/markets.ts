import { Hono } from "hono";
import type { Market } from "@moonwell-fi/moonwell-sdk";
import type { Env } from "../env.js";
import {
  setupChain,
  parsePositiveInt,
  parseEnumQuery,
} from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";
import { notFound } from "../lib/errors.js";
import { isDeprecatedMarket } from "../lib/contracts.js";

const READ_CACHE_SECONDS = 30;

const markets = new Hono<{ Bindings: Env }>();

function utilization(m: Pick<Market, "totalSupplyUsd" | "totalBorrowsUsd">): number {
  return m.totalSupplyUsd > 0 ? m.totalBorrowsUsd / m.totalSupplyUsd : 0;
}

function marketToJson(m: Market, chainId: number): Record<string, unknown> {
  return {
    asset: m.underlyingToken.symbol,
    assetAddress: m.underlyingToken.address,
    mToken: m.marketToken.symbol,
    mTokenAddress: m.marketToken.address,
    /**
     * True for legacy/wind-down markets like Base mUSDbC. The symbol can
     * still collide with the canonical market (both report `mUSDC`), so
     * downstream consumers should filter on this rather than the symbol.
     */
    deprecated: isDeprecatedMarket(chainId, m.marketToken.address),
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
  let chainId: number | null = null;
  try {
    // Validate inputs before touching RPC — fail fast on bad params.
    const limit = parsePositiveInt(c.req.query("limit"), "limit");
    const sortKey = parseEnumQuery(
      c.req.query("sort"),
      "sort",
      ["tvl", "supply-apy", "borrow-apy"] as const,
      "tvl",
    );
    const asset = c.req.query("asset");

    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;

    const list = await sdkClient.getMarkets({ chainId: chain.chainId });
    let filtered = [...list];

    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (m) =>
          m.underlyingToken.symbol.toUpperCase() === sym ||
          m.marketToken.symbol.toUpperCase() === sym,
      );
    }

    filtered.sort((a, b) => {
      switch (sortKey) {
        case "supply-apy":
          return b.baseSupplyApy - a.baseSupplyApy;
        case "borrow-apy":
          return a.baseBorrowApy - b.baseBorrowApy;
        case "tvl":
          return b.totalSupplyUsd - a.totalSupplyUsd;
      }
    });

    if (limit !== undefined) {
      filtered = filtered.slice(0, limit);
    }

    return ok(
      c,
      "markets",
      chain.chainId,
      filtered.map((m) => marketToJson(m, chain.chainId)),
      { cacheSeconds: READ_CACHE_SECONDS },
    );
  } catch (err) {
    return fail(c, "markets", chainId, err);
  }
});

/** GET /v1/markets/:id?chain=…  (id = symbol or mToken/underlying address) */
markets.get("/:id", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const id = c.req.param("id");

    const list = await sdkClient.getMarkets({ chainId: chain.chainId });
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(id);
    const idLower = id.toLowerCase();
    const sym = id.toUpperCase();

    const market = list.find((m) => {
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
        notFound(`Market "${id}" not found on ${chain.name}`),
      );
    }

    return ok(c, "markets", chain.chainId, marketToJson(market, chain.chainId), {
      cacheSeconds: READ_CACHE_SECONDS,
    });
  } catch (err) {
    return fail(c, "markets", chainId, err);
  }
});

export default markets;
