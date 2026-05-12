import { Hono } from "hono";
import type { Env } from "../env.js";
import { setupChain, requireAddress } from "../lib/context.js";
import { ok, fail } from "../lib/respond.js";

const accounts = new Hono<{ Bindings: Env }>();

/** GET /v1/positions/:address?chain=…[&asset=…] */
accounts.get("/positions/:address", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const address = requireAddress(c.req.param("address"));

    const positions = await sdkClient.getUserPositions({
      userAddress: address,
      chainId: chain.chainId,
    });

    let filtered = [...positions];
    const asset = c.req.query("asset");
    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (p) => p.market.symbol.toUpperCase() === sym,
      );
    }

    return ok(
      c,
      "positions",
      chain.chainId,
      filtered.map((p) => ({
        market: p.market.symbol,
        marketAddress: p.market.address,
        suppliedUsd: p.suppliedUsd,
        borrowedUsd: p.borrowedUsd,
        collateralUsd: p.collateralUsd,
        collateralEnabled: p.collateralEnabled,
      })),
    );
  } catch (err) {
    return fail(c, "positions", chainId, err);
  }
});

/** GET /v1/health/:address?chain=… */
accounts.get("/health/:address", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const address = requireAddress(c.req.param("address"));

    const positions = await sdkClient.getUserPositions({
      userAddress: address,
      chainId: chain.chainId,
    });

    let totalSupplyUsd = 0;
    let totalBorrowUsd = 0;
    let totalCollateralUsd = 0;
    for (const p of positions) {
      totalSupplyUsd += p.suppliedUsd;
      totalBorrowUsd += p.borrowedUsd;
      totalCollateralUsd += p.collateralUsd;
    }

    const healthFactor =
      totalBorrowUsd > 0 ? totalCollateralUsd / totalBorrowUsd : null;

    return ok(c, "health", chain.chainId, {
      address,
      totalSupplyUsd,
      totalBorrowUsd,
      totalCollateralUsd,
      healthFactor,
      marketCount: positions.length,
    });
  } catch (err) {
    return fail(c, "health", chainId, err);
  }
});

/** GET /v1/rewards/:address?chain=… */
accounts.get("/rewards/:address", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const address = requireAddress(c.req.param("address"));

    const rewards = await sdkClient.getUserRewards({
      userAddress: address,
      chainId: chain.chainId,
    });

    return ok(
      c,
      "rewards",
      chain.chainId,
      rewards.map((r) => ({
        market: r.market.symbol,
        rewardToken: r.rewardToken.symbol,
        supplyRewardsUsd: r.supplyRewardsUsd,
        borrowRewardsUsd: r.borrowRewardsUsd,
      })),
    );
  } catch (err) {
    return fail(c, "rewards", chainId, err);
  }
});

/** GET /v1/token-balance/:address?chain=…[&asset=…] */
accounts.get("/token-balance/:address", async (c) => {
  let chainId: number | null = null;
  try {
    const { chain, sdkClient } = setupChain(c.env, c.req.query("chain"));
    chainId = chain.chainId;
    const address = requireAddress(c.req.param("address"));

    const balances = await sdkClient.getUserBalances({
      userAddress: address,
      chainId: chain.chainId,
    });

    let filtered = [...balances];
    const asset = c.req.query("asset");
    if (asset) {
      const sym = asset.toUpperCase();
      filtered = filtered.filter(
        (b) => b.token.symbol.toUpperCase() === sym,
      );
    }

    return ok(
      c,
      "token-balance",
      chain.chainId,
      filtered.map((b) => ({
        token: b.token.symbol,
        address: b.token.address,
        balance: b.tokenBalance.value,
      })),
    );
  } catch (err) {
    return fail(c, "token-balance", chainId, err);
  }
});

export default accounts;
