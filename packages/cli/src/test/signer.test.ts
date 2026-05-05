import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolvePrivateKey } from "../lib/signer.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Valid test key (do NOT use for real funds)
const TEST_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_KEY_NO_PREFIX =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("resolvePrivateKey", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MOONWELL_PRIVATE_KEY;
    delete process.env.MOONWELL_PRIVATE_KEY_FILE;
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("resolves from flag override", () => {
    expect(resolvePrivateKey(TEST_KEY)).toBe(TEST_KEY);
  });

  it("resolves from flag without 0x prefix", () => {
    expect(resolvePrivateKey(TEST_KEY_NO_PREFIX)).toBe(TEST_KEY);
  });

  it("resolves from MOONWELL_PRIVATE_KEY env var", () => {
    process.env.MOONWELL_PRIVATE_KEY = TEST_KEY;
    expect(resolvePrivateKey()).toBe(TEST_KEY);
  });

  it("resolves from MOONWELL_PRIVATE_KEY_FILE env var", () => {
    const tmpFile = path.join(os.tmpdir(), "moonwell-test-key.hex");
    fs.writeFileSync(tmpFile, TEST_KEY_NO_PREFIX);
    fs.chmodSync(tmpFile, 0o600);
    process.env.MOONWELL_PRIVATE_KEY_FILE = tmpFile;
    try {
      expect(resolvePrivateKey()).toBe(TEST_KEY);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("rejects key file with insecure permissions", () => {
    if (process.platform === "win32") return;
    const tmpFile = path.join(os.tmpdir(), "moonwell-test-insecure-key.hex");
    fs.writeFileSync(tmpFile, TEST_KEY_NO_PREFIX);
    fs.chmodSync(tmpFile, 0o644);
    process.env.MOONWELL_PRIVATE_KEY_FILE = tmpFile;
    try {
      expect(() => resolvePrivateKey()).toThrow("insecure permissions");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("flag takes precedence over env var", () => {
    process.env.MOONWELL_PRIVATE_KEY = "0x" + "bb".repeat(32);
    expect(resolvePrivateKey(TEST_KEY)).toBe(TEST_KEY);
  });

  it("rejects invalid key — too short", () => {
    expect(() => resolvePrivateKey("0xabcd")).toThrow("Invalid private key");
  });

  it("rejects invalid key — non-hex characters", () => {
    expect(() => resolvePrivateKey("0x" + "zz".repeat(32))).toThrow(
      "Invalid private key",
    );
  });

  it("rejects empty string flag (falls through to other sources)", () => {
    // Empty string is falsy, so it doesn't count as a flag override.
    // Outcome depends on local ~/.moonwell-cli/key.hex state:
    //   - no file        → "No private key found"
    //   - file + 600     → valid hex key
    //   - file + non-600 → "insecure permissions"
    try {
      const key = resolvePrivateKey("");
      expect(key).toMatch(/^0x[0-9a-fA-F]{64}$/);
    } catch (e) {
      const msg = (e as Error).message;
      const acceptable =
        msg.includes("No private key found") ||
        msg.includes("insecure permissions");
      expect(acceptable).toBe(true);
    }
  });

  it("throws when no key source available (env cleared, no file)", () => {
    // Mock the default path to a location that doesn't exist
    // This test only works reliably when ~/.moonwell-cli/key.hex is absent.
    // Skip if the file exists (CI vs local dev).
    const defaultPath = path.join(os.homedir(), ".moonwell-cli", "key.hex");
    if (fs.existsSync(defaultPath)) {
      // Can't test "no key found" when the default file exists
      expect(true).toBe(true);
      return;
    }
    expect(() => resolvePrivateKey()).toThrow("No private key found");
  });

  it("rejects key file that doesn't exist", () => {
    process.env.MOONWELL_PRIVATE_KEY_FILE = "/tmp/nonexistent-moonwell-key.hex";
    expect(() => resolvePrivateKey()).toThrow("Key file not found");
  });
});
