import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "skill", "SKILL.md");
const dst = join(here, "..", "public", "skill.md");

copyFileSync(src, dst);
const cwd = process.cwd();
console.log(`synced ${relative(cwd, src)} → ${relative(cwd, dst)}`);
