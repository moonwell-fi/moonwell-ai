#!/usr/bin/env node
/**
 * Block commits that introduce a pnpm-lock.yaml entry younger than the
 * cooling-off window (default 72h). Defense against the TanStack-style
 * attack where a freshly-published malicious version (alive for hours
 * before detection) gets picked up by Renovate/Dependabot and merged.
 *
 *   COOLING_OFF_HOURS=24 git commit ...   # tune the window
 *   COOLING_OFF_OVERRIDE=1 git commit ... # bypass for emergency hotfixes
 */
import { execFileSync } from "node:child_process";

const LOCKFILE = "pnpm-lock.yaml";
const HOURS = Number(process.env.COOLING_OFF_HOURS) || 72;
const OVERRIDE = process.env.COOLING_OFF_OVERRIDE === "1";

if (OVERRIDE) {
  console.warn(`[cooling-off] Bypassed via COOLING_OFF_OVERRIDE=1.`);
  process.exit(0);
}

const stagedFiles = git(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
if (!stagedFiles.includes(LOCKFILE)) {
  process.exit(0);
}

const staged = git(["show", `:${LOCKFILE}`]);
const head = tryGit(["show", `HEAD:${LOCKFILE}`]) ?? "";

const added = [...extract(staged)].filter((e) => !extract(head).has(e));
if (added.length === 0) {
  process.exit(0);
}

console.log(`[cooling-off] Checking publish times for ${added.length} new package version(s) (window: ${HOURS}h)...`);

const tooNew = [];
const errors = [];

await Promise.all(
  added.map(async (entry) => {
    const at = entry.lastIndexOf("@");
    const name = entry.slice(0, at);
    const version = entry.slice(at + 1);
    try {
      // Full metadata (not abbreviated) — only this includes `time`.
      const res = await fetch(`https://registry.npmjs.org/${name}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        errors.push(`  ${name}: HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      const publishedAt = data.time?.[version];
      if (!publishedAt) {
        errors.push(`  ${name}@${version}: no publish timestamp in registry response`);
        return;
      }
      const ageHours = (Date.now() - Date.parse(publishedAt)) / 36e5;
      if (ageHours < HOURS) {
        tooNew.push({ name, version, ageHours, publishedAt });
      }
    } catch (err) {
      errors.push(`  ${name}@${version}: ${err.message}`);
    }
  }),
);

for (const line of errors) {
  console.warn(`[cooling-off] warn: ${line}`);
}

if (tooNew.length > 0) {
  console.error(`\n[cooling-off] BLOCKED — ${tooNew.length} package version(s) younger than ${HOURS}h:`);
  for (const { name, version, ageHours, publishedAt } of tooNew) {
    console.error(`  ${name}@${version}  published ${publishedAt}  (${ageHours.toFixed(1)}h ago)`);
  }
  console.error(`\nWait for the cooling-off window to pass, or for emergencies:`);
  console.error(`  COOLING_OFF_OVERRIDE=1 git commit ...`);
  console.error(`  COOLING_OFF_HOURS=24 git commit ...   # tune the window`);
  process.exit(1);
}

console.log(`[cooling-off] OK — all ${added.length} new versions are older than ${HOURS}h.`);

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function tryGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

/**
 * Extract `name@version` entries from the `packages:` section of a pnpm-lock.yaml.
 * Ignores peer-dep suffixes like `react-dom@18.2.0(react@18.2.0)` and uses the
 * base version only — that's the version actually fetched from the registry.
 */
function extract(content) {
  const out = new Set();
  let inPackages = false;
  for (const line of content.split("\n")) {
    if (/^[A-Za-z]/.test(line)) {
      inPackages = line.trimEnd() === "packages:";
      continue;
    }
    if (!inPackages) continue;
    const m = line.match(/^ {2}'?(@?[A-Za-z0-9][A-Za-z0-9._/-]*)@([0-9][^'(:\s]*?)(?:\([^)]*\))?'?:\s*$/);
    if (m) out.add(`${m[1]}@${m[2]}`);
  }
  return out;
}
