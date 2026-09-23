// Verify the built dist is reference-closed: every relative import in every
// reachable file must resolve, and no emitted chunk may be unreachable.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";

const DIST = process.argv[2] ?? "dist";
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
const expectedOptional = [];
// Lazy runtime variants the node build does not ship: the chunk resolves them
// with `new URL("./x.js", import.meta.url)` inside an async fallback that only
// runs on the web/wasm path. Pre-existing, not a packaging defect.
const OPTIONAL_VARIANTS = [/^\.\/transformers-(web|node-wasm)\.js$/];
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
      if (OPTIONAL_VARIANTS.some((pattern) => pattern.test(spec))) expectedOptional.push(line);
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
console.log(`optional variants not shipped (expected): ${expectedOptional.length}`);
for (const e of expectedOptional) console.log(`   ${e}`);
console.log(`\nverdict: ${unresolved.length === 0 && orphans.length === 0 ? "CLEAN — closed graph, no dead files" : "NEEDS ATTENTION"}`);
