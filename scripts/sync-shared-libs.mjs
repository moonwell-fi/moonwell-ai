#!/usr/bin/env node
/**
 * Copy domain-logic libs from packages/cli/src/lib → packages/api/src/lib.
 *
 * The CLI is the source of truth for these files. The API is a duplicate by
 * design (chosen for simplicity over a shared package).
 *
 * Usage:
 *   node scripts/sync-shared-libs.mjs           # copy and overwrite
 *   node scripts/sync-shared-libs.mjs --check   # exit 1 if anything would change
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const cliLib = join(repoRoot, "packages", "cli", "src", "lib");
const apiLib = join(repoRoot, "packages", "api", "src", "lib");

// Files synced verbatim. CLI is source of truth.
const SYNCED = [
  "prepare.ts",
  "abis.ts",
  "contracts.ts",
  "chains.ts",
  "amount.ts",
  "mtoken-resolver.ts",
  "types.ts",
  "errors.ts",
];

// Doc files copied verbatim from packages/skill/ to packages/web/public/.
// agents.moonwell.fi/skill.md serves this directly (static asset); the
// canonical source lives in packages/skill/ so the npm-published package
// can ship it.
const SYNCED_DOCS = [
  {
    src: join(repoRoot, "packages", "skill", "SKILL.md"),
    dst: join(repoRoot, "packages", "web", "public", "skill.md"),
  },
];

// Files that intentionally diverge — manual reconciliation only.
// (The worker variants are named differently where appropriate to make the
// split obvious in code review and avoid accidental hand-syncs.)
const EXCLUDED_NOTE = [
  "client.ts (worker takes rpcUrl from env, not flag)",
  "moonwell.ts (worker is stateless, no module cache)",
  "json-output.ts (worker only — no chalk/console; bigint-safe stringify)",
];

const checkOnly = process.argv.includes("--check");
let mismatches = 0;

function syncPair(src, dst) {
  const srcContent = readFileSync(src, "utf8");
  let dstContent = "";
  try {
    dstContent = readFileSync(dst, "utf8");
  } catch {
    // file doesn't exist yet
  }

  if (srcContent === dstContent) {
    if (!checkOnly) {
      console.log(`= ${relative(repoRoot, dst)}`);
    }
    return false; // not a mismatch
  }

  if (checkOnly) {
    console.error(`! ${relative(repoRoot, dst)} (out of sync with ${relative(repoRoot, src)})`);
  } else {
    writeFileSync(dst, srcContent);
    console.log(`✓ ${relative(repoRoot, dst)}`);
  }
  return true;
}

for (const file of SYNCED) {
  if (syncPair(join(cliLib, file), join(apiLib, file))) mismatches++;
}

for (const { src, dst } of SYNCED_DOCS) {
  if (syncPair(src, dst)) mismatches++;
}

if (checkOnly && mismatches > 0) {
  console.error(`\n${mismatches} file(s) out of sync. Run \`pnpm sync-shared\` to fix.`);
  process.exit(1);
}

if (!checkOnly) {
  console.log("");
  console.log("Excluded from sync (manual reconciliation):");
  for (const note of EXCLUDED_NOTE) {
    console.log(`  - ${note}`);
  }
}
