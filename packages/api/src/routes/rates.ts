import { Hono } from "hono";
import type { Market } from "@moonwell-fi/moonwell-sdk";
import type { Env } from "../env.js";
import { setupChain } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";

const READ_CACHE_SECONDS = 30;

const rates = new Hono<{ Bindings: Env }>();

function utilization(m: Pick<Market, "totalSupplyUsd" | "totalBorrowsUsd">): number {
  return m.totalSupplyUsd > 0 ? m.totalBorrowsUsd / m.totalSupplyUsd : 0;
}

/** GET /v1/rates?chain=…[&asset=…] */
rates.get("/", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;

    const markets = await sdkClient.getMarkets({ chainId: chain.chainId });
    let filtered = [...markets];

    const asset = c.req.query("asset");
    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (m) => m.underlyingToken.symbol.toUpperCase() === sym,
      );
    }

    return ok(
      c,
      "rates",
      chain.chainId,
      filtered.map((m) => ({
        asset: m.underlyingToken.symbol,
        baseSupplyApy: m.baseSupplyApy,
        baseBorrowApy: m.baseBorrowApy,
        totalSupplyApr: m.totalSupplyApr,
        totalBorrowApr: m.totalBorrowApr,
        utilization: utilization(m),
      })),
      { cacheSeconds: READ_CACHE_SECONDS },
    );
  } catch (err) {
    return fail(c, "rates", chainId, err);
  }
});

export default rates;
