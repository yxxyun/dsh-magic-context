// Verify the built dist is reference-closed: every relative import in every
// reachable file must resolve, and no emitted chunk may be unreachable.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Default to the plugin's build output, resolved from THIS script so the command
// works from anywhere in the repo (a bare "dist" silently meant <cwd>/dist).
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.argv[2] ?? join(REPO_ROOT, "packages", "dsh-plugin", "dist");
const ENTRY_POINTS = ["agent", "compaction", "commands", "tools", "remote"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
}

const all = walk(DIST);
const roots = all.filter((file) => {
  const rel = relative(DIST, file).split(sep).join("/");
  if (rel === "index.js" || rel === "cli.js") return true;
  const match = /^entries\/([a-z]+)\.js$/.exec(rel);
  return match !== null && ENTRY_POINTS.includes(match[1]);
});

const SPEC = /["'](\.\.?\/[^"']+?\.js)["']/g;

function importsOf(file) {
  const text = readFileSync(file, "utf8");
  const found = new Set();
  for (const match of text.matchAll(SPEC)) found.add(match[1]);
  return [...found];
}

const reachable = new Set();
const unresolved = [];
const missingRequired = [];
// The lazy local-embedding variants. These ARE shipped — the build vendors them
// from upstream into dist/entries — so a missing one is a defect, not an
// expected absence: it silently degrades /ctx-embed and the whole vector lane to
// "no embedding provider". (This check previously waved them through, which is
// exactly how that gap stayed invisible.)
const REQUIRED_VARIANTS = [/^\.\/transformers-(web|node-wasm)\.js$/];
const queue = [...roots];
while (queue.length > 0) {
  const file = queue.pop();
  const abs = resolve(file);
  if (reachable.has(abs)) continue;
  reachable.add(abs);
  for (const spec of importsOf(file)) {
    const target = resolve(dirname(file), spec);
    if (!existsSync(target)) {
      const line = `${relative(DIST, file).split(sep).join("/")} -> ${spec}`;
      if (REQUIRED_VARIANTS.some((pattern) => pattern.test(spec))) missingRequired.push(line);
      else unresolved.push(line);
      continue;
    }
    queue.push(target);
  }
}

console.log(`roots (${roots.length}):`);
for (const r of roots.map((f) => relative(DIST, f).split(sep).join("/")).sort()) console.log(`   ${r}`);
console.log(`\nfiles in dist       : ${all.length}`);
console.log(`reachable from roots: ${reachable.size}`);
const orphans = all.filter((f) => !reachable.has(resolve(f)));
console.log(`UNREACHABLE (dead)  : ${orphans.length}`);
for (const o of orphans) console.log(`   ${relative(DIST, o).split(sep).join("/")}`);
console.log(`UNRESOLVED imports  : ${unresolved.length}`);
for (const u of unresolved) console.log(`   ${u}`);
console.log(`MISSING REQUIRED variants: ${missingRequired.length}`);
for (const m of missingRequired) console.log(`   ${m}`);
console.log(`\nverdict: ${unresolved.length === 0 && missingRequired.length === 0 && orphans.length === 0 ? "CLEAN — closed graph, no dead files, embedding variants present" : "NEEDS ATTENTION"}`);
