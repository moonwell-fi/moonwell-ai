/**
 * Typed Cloudflare Worker bindings.
 *
 * Secrets are set out-of-band via `wrangler secret put`. The plain `vars`
 * (e.g. `ENVIRONMENT`) come from `wrangler.jsonc` `vars`.
 */
export interface Env {
  ENVIRONMENT: "production" | "preview" | "development";
  BASE_RPC_URL: string;
  OPTIMISM_RPC_URL: string;
}
