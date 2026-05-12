import { describe, it, expect } from "vitest";
import app from "../src/index.js";
import type { Env } from "../src/env.js";

/**
 * In-process route tests via Hono's `app.request()`. These exercise the
 * validation / error-envelope / CORS / 404 paths that pure unit tests miss,
 * without needing an RPC or wrangler dev. Routes that would call the SDK
 * are tested with dummy RPC URLs and inputs that fail validation *before*
 * any RPC happens — so no network is required.
 */

async function asJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

const ENV: Env = {
  ENVIRONMENT: "production",
  BASE_RPC_URL: "https://invalid-rpc.test",
  OPTIMISM_RPC_URL: "https://invalid-rpc.test",
};

const ENV_NO_RPC: Env = {
  ENVIRONMENT: "production",
  BASE_RPC_URL: "",
  OPTIMISM_RPC_URL: "",
};

describe("/v1/_health", () => {
  it("liveness — returns ok regardless of RPC config", async () => {
    const res = await app.request("/v1/_health", undefined, ENV_NO_RPC);
    expect(res.status).toBe(200);
    const body = await asJson(res);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("moonwell-api");
  });

  it("?deep=1 returns 503 when RPC secrets are missing", async () => {
    const res = await app.request("/v1/_health?deep=1", undefined, ENV_NO_RPC);
    expect(res.status).toBe(503);
    const body = await asJson(res);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("RPC");
  });
});

describe("validation — bad query params 400, no RPC needed", () => {
  it("/v1/markets?limit=abc returns 400 without hitting RPC", async () => {
    const res = await app.request("/v1/markets?limit=abc", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid limit");
  });

  it("/v1/markets?limit=-5 returns 400", async () => {
    const res = await app.request("/v1/markets?limit=-5", undefined, ENV);
    expect(res.status).toBe(400);
  });

  it("/v1/yield?min-tvl=NaN returns 400 without hitting RPC", async () => {
    const res = await app.request("/v1/yield?min-tvl=NaN", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("min-tvl");
  });

  it("/v1/positions/notahex returns 400", async () => {
    const res = await app.request("/v1/positions/notahex", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("Invalid address");
  });

  it("/v1/markets?chain=ethereum returns 400 (unsupported chain)", async () => {
    const res = await app.request("/v1/markets?chain=ethereum", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("Unsupported chain");
  });
});

describe("/v1/prepare/:verb — chain default", () => {
  it("doesn't reject when `chain` is omitted (defaults to base downstream)", async () => {
    // The validator must not throw on missing chain. The SDK call may still
    // fail with the bogus RPC URL, but the error must NOT be "chain is required".
    const res = await app.request(
      "/v1/prepare/supply",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          asset: "USDC",
          amountDecimal: "1",
          from: "0x000000000000000000000000000000000000dEaD",
        }),
      },
      ENV,
    );
    const body = await asJson<{ error?: string }>(res);
    expect(body.error ?? "").not.toContain("`chain` is required");
  });

  it("doesn't reject GET when `chain` is omitted from query", async () => {
    const res = await app.request(
      "/v1/prepare/supply?asset=USDC&amountDecimal=1&from=0x000000000000000000000000000000000000dEaD",
      undefined,
      ENV,
    );
    const body = await asJson<{ error?: string }>(res);
    expect(body.error ?? "").not.toContain("`chain` is required");
  });
});

describe("/v1/prepare/:verb", () => {
  it("rejects empty body with 400", async () => {
    const res = await app.request(
      "/v1/prepare/supply",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("`asset` is required");
  });

  it("rejects unknown verb with 400", async () => {
    const res = await app.request(
      "/v1/prepare/yolo",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain: "base",
          asset: "USDC",
          amountDecimal: "1",
          from: "0x000000000000000000000000000000000000dEaD",
        }),
      },
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain('Unknown verb "yolo"');
  });

  it("rejects bad from address with 400", async () => {
    const res = await app.request(
      "/v1/prepare/supply",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain: "base",
          asset: "USDC",
          amountDecimal: "1",
          from: "not-a-hex",
        }),
      },
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("`from` must be a valid");
  });
});

describe("GET /v1/prepare/:verb (query-param mode)", () => {
  it("rejects empty query with 400 (same body validator as POST)", async () => {
    const res = await app.request("/v1/prepare/supply", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("`asset` is required");
  });

  it("rejects unknown verb with 400", async () => {
    const res = await app.request(
      "/v1/prepare/yolo?chain=base&asset=USDC&amountDecimal=1&from=0x000000000000000000000000000000000000dEaD",
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain('Unknown verb "yolo"');
  });

  it("rejects bad from address with 400", async () => {
    const res = await app.request(
      "/v1/prepare/supply?chain=base&asset=USDC&amountDecimal=1&from=not-a-hex",
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("`from` must be a valid");
  });

  it("rejects missing amount with 400", async () => {
    const res = await app.request(
      "/v1/prepare/supply?chain=base&asset=USDC&from=0x000000000000000000000000000000000000dEaD",
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toMatch(/Provide `amount`/);
  });

  it("rejects invalid simulate value with 400", async () => {
    const res = await app.request(
      "/v1/prepare/supply?chain=base&asset=USDC&amountDecimal=1&from=0x000000000000000000000000000000000000dEaD&simulate=maybe",
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await asJson(res);
    expect(body.error).toContain("Invalid simulate");
  });

  it("response is no-store (never cached)", async () => {
    const res = await app.request("/v1/prepare/supply", undefined, ENV);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("404 + envelope shape", () => {
  it("unknown path returns 404 with hint", async () => {
    const res = await app.request("/v1/does-not-exist", undefined, ENV);
    expect(res.status).toBe(404);
    const body = await asJson(res);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Not found");
    expect(body.hint).toContain("agents.moonwell.fi");
  });

  it("error responses use no-store cache header", async () => {
    const res = await app.request("/v1/markets?limit=abc", undefined, ENV);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("error responses are application/json", async () => {
    const res = await app.request("/v1/markets?limit=abc", undefined, ENV);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("meta.chain is null when chain never resolves", async () => {
    const res = await app.request("/v1/markets?limit=abc", undefined, ENV);
    expect(res.status).toBe(400);
    const body = await asJson<{ meta: { chain: string | null } }>(res);
    expect(body.meta.chain).toBeNull();
  });
});

describe("CORS", () => {
  it("allows agents.moonwell.fi", async () => {
    const res = await app.request(
      "/v1/_health",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://agents.moonwell.fi",
          "access-control-request-method": "GET",
        },
      },
      ENV,
    );
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://agents.moonwell.fi",
    );
  });

  it("allows localhost dev origin", async () => {
    const res = await app.request(
      "/v1/_health",
      {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "GET",
        },
      },
      ENV,
    );
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("rejects arbitrary browser origin", async () => {
    const res = await app.request(
      "/v1/_health",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://evil.example.com",
          "access-control-request-method": "GET",
        },
      },
      ENV,
    );
    // Hono's CORS middleware drops the allow-origin header when origin function returns null
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("root", () => {
  it("/ returns a JSON probe with a docs link", async () => {
    const res = await app.request("/", undefined, ENV);
    expect(res.status).toBe(200);
    const body = await asJson<{
      ok: boolean;
      service: string;
      docs: string;
    }>(res);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("moonwell-api");
    expect(body.docs).toBe("https://agents.moonwell.fi/skill.md");
  });
});
