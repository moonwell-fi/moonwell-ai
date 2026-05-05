import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env.js";
import { resolveChain, SUPPORTED_CHAINS } from "./lib/chains.js";
import { makeMoonwellClient } from "./lib/moonwell.js";
import markets from "./routes/markets.js";
import rates from "./routes/rates.js";
import yieldRoute from "./routes/yield.js";
import accounts from "./routes/accounts.js";
import prepare from "./routes/prepare.js";

const app = new Hono<{ Bindings: Env }>();

const ALLOWED_ORIGINS = [
  "https://agents.moonwell.fi",
  "https://moonwell.fi",
];
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return "*";                        // curl / server-to-server
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (LOCALHOST_RE.test(origin)) return origin;
    return null;                                     // browser fetch from anywhere else: blocked
  },
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["content-type"],
  maxAge: 86400,
}));

app.get("/", (c) => c.redirect("https://agents.moonwell.fi", 302));

/**
 * Liveness + (optionally) readiness probe.
 *   GET /v1/_health           — shallow: returns ok if the worker is reachable.
 *   GET /v1/_health?deep=1    — readiness: also verifies RPC secrets resolve and
 *                               each supported chain answers a cheap SDK call.
 */
app.get("/v1/_health", async (c) => {
  const base = {
    ok: true,
    service: "moonwell-api",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  };

  if (c.req.query("deep") !== "1") {
    return c.json(base);
  }

  if (!c.env.BASE_RPC_URL || !c.env.OPTIMISM_RPC_URL) {
    return c.json({ ...base, ok: false, error: "missing RPC secrets" }, 503);
  }

  const client = makeMoonwellClient({
    base: c.env.BASE_RPC_URL,
    optimism: c.env.OPTIMISM_RPC_URL,
  });

  const chains: Record<string, "ok" | string> = {};
  let anyFailed = false;
  await Promise.all(
    Object.values(SUPPORTED_CHAINS).map(async (cfg) => {
      try {
        await client.getMarkets({ chainId: resolveChain(cfg.networkName).chainId });
        chains[cfg.networkName] = "ok";
      } catch (err) {
        anyFailed = true;
        chains[cfg.networkName] =
          err instanceof Error ? err.message : "unknown error";
      }
    }),
  );

  return c.json(
    { ...base, ok: !anyFailed, chains },
    anyFailed ? 503 : 200,
  );
});

app.route("/v1/markets", markets);
app.route("/v1/rates", rates);
app.route("/v1/yield", yieldRoute);
app.route("/v1", accounts);          // mounts /positions/:address, /health/:address, /rewards/:address, /token-balance/:address
app.route("/v1/prepare", prepare);

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: `Not found: ${c.req.method} ${c.req.path}`,
      hint: "See https://agents.moonwell.fi/skill.md for the API contract.",
    },
    404,
  ),
);

app.onError((err, c) => {
  // Always log with full detail; never echo the raw message to clients —
  // SDK / viem / fetch errors carry upstream URLs and stack fragments.
  console.error("[unhandled]", err);
  return c.json(
    {
      success: false,
      error: "Internal error",
      hint: "See https://agents.moonwell.fi/skill.md for the API contract.",
    },
    500,
  );
});

export default app;
