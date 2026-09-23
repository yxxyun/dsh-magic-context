// Deep-compare my cordis.patch.yml preset-standard block against the real
// shipped standard.patch.yml, using the loader's own schema. Reports every
// per-row config difference, since a patch replaces `config` wholesale.
import { readFileSync } from "node:fs";
import * as yaml from "file:///C:/Users/%E6%9D%A8%E6%96%B0%E9%91%AB/.dsh/profiles/desktop/node_modules/js-yaml/dist/js-yaml.mjs";

const JsExpr = new yaml.Type("tag:yaml.org,2002:js", {
  kind: "scalar", resolve: (d) => typeof d === "string",
  construct: (d) => ({ __jsExpr: d }),
});
const schema = yaml.JSON_SCHEMA.extend(JsExpr);
const load = (p) => yaml.load(readFileSync(p, "utf8"), { schema });

const mine = load("packages/dsh-plugin/cordis.patch.yml");
const real = load("tools/real-standard.patch.yml");

const myRows = mine.find((p) => p.id === "preset-standard");
const realRows = real[0].insert.find((p) => p.id === "preset-standard");
if (!myRows) { console.error("my patch has no preset-standard row"); process.exit(1); }

const mp = myRows.config.plugins;
const rp = realRows.config.plugins;

function index(rows) {
  const out = new Map();
  const walk = (list, path) => {
    for (const r of list) {
      out.set(path + "/" + r.id, r);
      if (Array.isArray(r.config)) walk(r.config, path + "/" + r.id);
    }
  };
  walk(rows, "");
  return out;
}
const mi = index(mp), ri = index(rp);

const stable = (v) => JSON.stringify(v, Object.keys(v || {}).sort());
let diffs = 0;

console.log("=== preset id/order ===");
console.log("  mine:", myRows.config.id, myRows.config.order);
console.log("  real:", realRows.config.id, realRows.config.order);

console.log("\n=== rows only in mine ===");
for (const k of mi.keys()) if (!ri.has(k)) console.log("  +", k);

console.log("\n=== rows only in real ===");
for (const k of ri.keys()) if (!mi.has(k)) console.log("  -", k);

console.log("\n=== per-row field differences (mine vs real) ===");
for (const [k, r] of ri) {
  const m = mi.get(k);
  if (!m) continue;
  const keys = new Set([...Object.keys(m), ...Object.keys(r)]);
  for (const f of keys) {
    const a = stable(m[f]), b = stable(r[f]);
    if (a !== b) {
      diffs++;
      console.log(`  ${k}.${f}:`);
      console.log(`    mine: ${a}`);
      console.log(`    real: ${b}`);
    }
  }
}
console.log("\ntotal differing fields:", diffs);
