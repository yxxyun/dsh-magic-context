#!/usr/bin/env bun
/**
 * audit-host-symbols — does the SHIPPED DSH app still export everything this
 * bundle imports from it?
 *
 * WHY THIS EXISTS
 *
 * DSH ships a new prerelease often (0.1.7-alpha.1 → alpha.2 → rc.1), and a plugin
 * that compiles against stale type stubs keeps building happily while the host it
 * actually loads into has moved. That is not hypothetical: the port once read
 * `session.events`, a property the runtime had already replaced with a
 * `snapshotEvents()` method, and the resulting throw silently disabled an entire
 * plane because the stale @deepseek-ai type stubs still declared the property.
 *
 * `tsc` against the current devDeps is the primary defence — bump them and the
 * compiler reports drift. This script is the INDEPENDENT check: it audits the
 * emitted bundle (where the bundler has already erased type-only imports, so every
 * name is a real runtime value) against the `@deepseek-ai/*` packages inside the
 * installed app's app.asar, following `export * from` re-exports and resolving
 * subpath entries through each package's own `exports` map.
 *
 * USAGE
 *
 *   bun tools/audit-host-symbols.mjs <dist-dir>
 *
 * Env: DSH_ASAR overrides the app.asar path.
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, posix } from "node:path";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASAR = process.env.DSH_ASAR?.trim() || "D:/DeepSeekHarness/resources/app.asar";
const ASAR2 = join(HERE, "asar2.mjs");
const DIST = process.argv[2];
const TMP = join(process.env.TEMP ?? "/tmp", "dsh-runtime-audit");

if (!DIST || !existsSync(DIST)) {
  console.error("usage: bun tools/audit-host-symbols.mjs <dist-dir>");
  process.exit(1);
}
if (!existsSync(ASAR)) {
  console.error(`error: app.asar not found at ${ASAR} (set DSH_ASAR to override)`);
  process.exit(1);
}
mkdirSync(TMP, { recursive: true });

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
}

// One import statement per match: bundles keep external imports as separate
// statements, so a bounded clause cannot swallow the following import.
const IMPORT = /import\s*\{([^}]*)\}\s*from\s*["'](@deepseek-ai\/[^"']+)["']/g;

const needed = new Map();
for (const file of walk(DIST)) {
  for (const match of readFileSync(file, "utf8").matchAll(IMPORT)) {
    const spec = match[2];
    if (!needed.has(spec)) needed.set(spec, new Set());
    for (const raw of match[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/)[0]?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) needed.get(spec).add(name);
    }
  }
}

const cache = new Map();
function fetchAsar(pathInAsar) {
  if (cache.has(pathInAsar)) return cache.get(pathInAsar);
  const out = join(TMP, pathInAsar.replace(/\//g, "__"));
  let text = null;
  try {
    execFileSync(process.execPath, [ASAR2, ASAR, "get", pathInAsar, out], { stdio: "ignore" });
    if (existsSync(out)) text = readFileSync(out, "utf8");
  } catch {
    text = null;
  }
  cache.set(pathInAsar, text);
  return text;
}

/** Exported names, following `export * from "./x.js"` inside the package. */
function collectExports(pkgDir, entryRel, seen = new Set(), depth = 0) {
  const names = new Set();
  if (depth > 6) return names;
  const rel = posix.normalize(entryRel.replace(/^\.\//, ""));
  const key = `${pkgDir}/${rel}`;
  if (seen.has(key)) return names;
  seen.add(key);
  const text = fetchAsar(key);
  if (text === null) return names;
  for (const match of text.matchAll(/export\s*\{([\s\S]*?)\}\s*(?:from\s*["'][^"']+["'])?/g)) {
    for (const raw of match[1].split(",")) {
      const parts = raw.trim().split(/\s+as\s+/);
      const exported = (parts[1] ?? parts[0]).replace(/^type\s+/, "").trim();
      if (exported) names.add(exported);
    }
  }
  for (const match of text.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1]);
  }
  if (/export\s+default/.test(text)) names.add("default");
  for (const match of text.matchAll(/export\s*\*\s*from\s*["']([^"']+)["']/g)) {
    const next = posix.normalize(posix.join(posix.dirname(rel), match[1]));
    for (const name of collectExports(pkgDir, next, seen, depth + 1)) names.add(name);
  }
  return names;
}

console.log(`bundle : ${DIST}`);
console.log(`host   : ${ASAR}`);
console.log(`specifiers: ${needed.size}\n`);

let missing = 0;
let total = 0;
for (const spec of [...needed.keys()].sort()) {
  const [pkg, ...subParts] = spec.slice("@deepseek-ai/".length).split("/");
  const sub = subParts.join("/");
  const pkgDir = `dsh/node_modules/@deepseek-ai/${pkg}`;
  const metaText = fetchAsar(`${pkgDir}/package.json`);
  if (metaText === null) {
    console.log(`  MISS ${spec}  (package absent from the app)`);
    missing += needed.get(spec).size;
    continue;
  }
  const meta = JSON.parse(metaText);
  const resolved = (meta.exports ?? {})[sub.length > 0 ? `./${sub}` : "."];
  let entry;
  if (typeof resolved === "string") entry = resolved;
  else if (resolved && typeof resolved === "object") entry = resolved.import ?? resolved.default ?? resolved.require;
  if (!entry) entry = sub.length > 0 ? `${sub}.js` : (meta.module ?? meta.main ?? "lib/index.js");

  const surface = collectExports(pkgDir, String(entry));
  const want = [...needed.get(spec)];
  const absent = want.filter((name) => !surface.has(name));
  total += want.length;
  missing += absent.length;
  console.log(
    `  ${absent.length === 0 ? "OK  " : "MISS"} ${spec.padEnd(42)} v${String(meta.version).padEnd(12)} ` +
      `${want.length - absent.length}/${want.length}  (surface ${surface.size})`,
  );
  if (absent.length > 0) console.log(`        missing: ${absent.join(", ")}`);
}
console.log(`\nruntime symbols checked: ${total}; missing: ${missing}`);
process.exit(missing === 0 ? 0 : 1);
