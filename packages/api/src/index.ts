import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env.js";
import markets from "./routes/markets.js";
import rates from "./routes/rates.js";
import yieldRoute from "./routes/yield.js";
import accounts from "./routes/accounts.js";
import prepare from "./routes/prepare.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["content-type"],
  maxAge: 86400,
}));

app.get("/", (c) => c.redirect("https://agents.moonwell.fi", 302));

app.get("/v1/_health", (c) => {
  return c.json({
    ok: true,
    service: "moonwell-api",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
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
  console.error("[unhandled]", err);
  return c.json(
    {
      success: false,
      error: err.message ?? "Internal error",
    },
    500,
  );
});

export default app;
