#!/usr/bin/env node
/**
 * Run lifecycle scripts for packages on `lifecycleScriptAllowlist` in
 * the root package.json, plus the root's own `prepare` script (so husky
 * gets wired up). Everything else stays blocked by `.npmrc#ignore-scripts`.
 *
 * Add a new entry to the allowlist when a legitimate dep needs to compile a
 * native binary at install time (e.g. `sharp`, `esbuild`). Be conservative.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const rootPkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const allowed = rootPkg.lifecycleScriptAllowlist ?? [];

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: repoRoot });
  if (result.status !== 0) {
    console.error(`\n[allow-scripts] \`${cmd} ${args.join(" ")}\` exited with ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (allowed.length > 0) {
  // `pnpm rebuild` runs install/postinstall scripts for the named packages
  // regardless of the global ignore-scripts setting. Pattern globs (e.g.
  // "@img/sharp-*") are supported.
  run("pnpm", ["rebuild", ...allowed]);
} else {
  console.log("[allow-scripts] No packages in lifecycleScriptAllowlist — skipping rebuild step.");
}

// Wire up husky (root `prepare` script). Skipped during `pnpm install` because
// ignore-scripts also blocks the consumer's own lifecycle scripts.
if (rootPkg.scripts?.prepare) {
  run("pnpm", ["run", "prepare"]);
}
