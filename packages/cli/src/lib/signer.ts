import { type WalletClient, type Transport, type Chain, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ChainConfig } from "./chains.js";
import { usage } from "./errors.js";

const ENV_PRIVATE_KEY = "MOONWELL_PRIVATE_KEY";
const ENV_PRIVATE_KEY_FILE = "MOONWELL_PRIVATE_KEY_FILE";
const CONFIG_DIR = ".moonwell-cli";
const KEY_FILE = "key.hex";
const HEX_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Resolve a private key from (in order of precedence):
 * 1. --private-key flag
 * 2. MOONWELL_PRIVATE_KEY env var
 * 3. MOONWELL_PRIVATE_KEY_FILE env var
 * 4. ~/.moonwell-cli/key.hex file
 */
export function resolvePrivateKey(flagOverride?: string): `0x${string}` {
  if (flagOverride) {
    return validateKey(normalizeKey(flagOverride), "--private-key flag");
  }

  const envKey = process.env[ENV_PRIVATE_KEY]?.trim();
  if (envKey) {
    return validateKey(normalizeKey(envKey), `${ENV_PRIVATE_KEY} env var`);
  }

  const envFile = process.env[ENV_PRIVATE_KEY_FILE]?.trim();
  if (envFile) {
    return readKeyFile(envFile);
  }

  const defaultPath = path.join(os.homedir(), CONFIG_DIR, KEY_FILE);
  if (fs.existsSync(defaultPath)) {
    return readKeyFile(defaultPath);
  }

  throw usage(
    `No private key found. Provide --private-key, set ${ENV_PRIVATE_KEY}, ` +
    `set ${ENV_PRIVATE_KEY_FILE}, or place key at ~/${CONFIG_DIR}/${KEY_FILE}`,
  );
}

function readKeyFile(filePath: string): `0x${string}` {
  try {
    if (process.platform !== "win32") {
      const stats = fs.statSync(filePath);
      if ((stats.mode & 0o077) !== 0) {
        throw usage(
          `Key file ${filePath} has insecure permissions (mode ${(stats.mode & 0o777).toString(8)}). ` +
          `Expected owner-only access. Run: chmod 600 ${filePath}`,
        );
      }
    }
    const content = fs.readFileSync(filePath, "utf-8").trim();
    return validateKey(normalizeKey(content), filePath);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      throw usage(`Key file not found: ${filePath}`);
    }
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "EACCES") {
      throw usage(`Permission denied reading key file: ${filePath}`);
    }
    throw err;
  }
}

function normalizeKey(raw: string): `0x${string}` {
  const cleaned = raw.trim();
  if (cleaned.startsWith("0x")) {
    return cleaned as `0x${string}`;
  }
  return `0x${cleaned}`;
}

function validateKey(key: `0x${string}`, source: string): `0x${string}` {
  if (!HEX_RE.test(key)) {
    throw usage(
      `Invalid private key from ${source}. Expected 0x-prefixed 64-char hex string (got ${key.length} chars).`,
    );
  }
  return key;
}

/**
 * Create a viem WalletClient for signing and broadcasting transactions.
 */
export function getWalletClient(
  chain: ChainConfig,
  privateKey: `0x${string}`,
  rpcUrl?: string,
): WalletClient<Transport, Chain> {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: chain.viemChain,
    transport: http(rpcUrl ?? chain.defaultRpcUrl),
  }) as WalletClient<Transport, Chain>;
}

/**
 * Derive the address from a private key.
 */
export function addressFromKey(privateKey: `0x${string}`): `0x${string}` {
  const account = privateKeyToAccount(privateKey);
  return account.address as `0x${string}`;
}
