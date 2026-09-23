// Resolve the FINAL effective state of every compaction-related row across all
// layers, honoring patch application order, so we can see whether Magic and
// billion-context collide or coexist.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as yaml from "file:///C:/Users/%E6%9D%A8%E6%96%B0%E9%91%AB/.dsh/profiles/desktop/node_modules/js-yaml/dist/js-yaml.mjs";

const ASAR = "D:/DeepSeekHarness/resources/app.asar";
const buf = readFileSync(ASAR);
const headerSize = buf.readUInt32LE(4);
const headerBuf = buf.subarray(8, 8 + headerSize).toString("utf8");
const start = headerBuf.indexOf('{"files"');
let depth = 0, end = -1, inStr = false, esc = false;
for (let i = start; i < headerBuf.length; i++) {
  const c = headerBuf[i];
  if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
  if (c === '"') inStr = true;
  else if (c === "{") depth++;
  else if (c === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
}
const json = JSON.parse(headerBuf.slice(start, end));
const BASE = 8 + headerSize;
const getNode = (p) => { let n = json; for (const k of p.split("/")) { if (!n.files) return undefined; n = n.files[k]; } return n; };
const asarText = (p) => { const n = getNode(p); if (!n) return undefined; const o = parseInt(n.offset, 10); return buf.subarray(BASE + o, BASE + o + n.size).toString("utf8"); };

const JsExpr = new yaml.Type("tag:yaml.org,2002:js", { kind: "scalar", resolve: (d) => typeof d === "string", construct: (d) => ({ __jsExpr: d }) });
const schema = yaml.JSON_SCHEMA.extend(JsExpr);

const profileDir = "C:/Users/杨新鑫/.dsh/profiles/desktop";
const pkg = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));

// Build the ordered layer list exactly as loadProfileDirectory does.
const layers = [];
const push = (label, text) => {
  const rows = yaml.load(text, { schema });
  layers.push({ label, rows: Array.isArray(rows) ? rows : [] });
};
// dsh-base
push("@deepseek-ai/dsh-base", asarText("dsh/node_modules/@deepseek-ai/dsh-base/cordis.patch.yml"));
// dsh-web-app: all declared patches
for (const f of ["cordis.patch.yml", "presets/standard.patch.yml", "presets/ptc.patch.yml", "presets/minimal.patch.yml", "presets/cordis.patch.yml"]) {
  push("@deepseek-ai/dsh-web-app:" + f, asarText("dsh/node_modules/@deepseek-ai/dsh-web-app/" + f));
}
// third-party bundles in declared order
for (const name of pkg.dsh.profile.bundles) {
  if (name.startsWith("@deepseek-ai/")) continue;
  const dir = join(profileDir, "node_modules", name);
  const p = join(dir, "package.json");
  if (!existsSync(p)) continue;
  const b = JSON.parse(readFileSync(p, "utf8")).dsh?.bundle?.patch;
  if (!b) continue;
  for (const f of (typeof b === "string" ? [b] : b)) {
    const fp = join(dir, f);
    if (existsSync(fp)) push(name + ":" + f, readFileSync(fp, "utf8"));
  }
}
// profile user layer
const up = join(profileDir, "cordis.patch.yml");
if (existsSync(up)) push("PROFILE-USER", readFileSync(up, "utf8"));

console.log("=== layer order ===");
layers.forEach((l, i) => console.log(`  [${i}] ${l.label} (${l.rows.length} rows)`));

// Replay the patch semantics precisely: insert rows add top-level rows; an
// id-targeted patch replaces the matching TOP-LEVEL row's fields wholesale.
const rows = new Map(); // id -> row
const order = [];
for (const layer of layers) {
  for (const patch of layer.rows) {
    if (patch.insert) {
      for (const r of patch.insert) {
        if (!rows.has(r.id)) order.push(r.id);
        rows.set(r.id, structuredClone(r));
      }
      continue;
    }
    if (!patch.id) continue;
    const tgt = rows.get(patch.id);
    if (!tgt) continue;               // warned and skipped by the loader
    const { id, insert, name, ...overrides } = patch;
    rows.set(patch.id, { ...tgt, ...structuredClone(overrides) });
  }
}

console.log("\n=== top-level compaction rows (final) ===");
for (const id of order) {
  if (!/compaction/.test(id)) continue;
  const r = rows.get(id);
  console.log(`  ${id}: name=${r.name} disabled=${r.disabled} config=${JSON.stringify(r.config)}`);
}

console.log("\n=== preset-standard (final, agent plane) ===");
const ps = rows.get("preset-standard");
if (!ps) console.log("  MISSING");
else {
  const plugins = ps.config?.plugins ?? [];
  const flat = [];
  (function walk(list, path) {
    for (const r of list) {
      flat.push({ path: path + "/" + r.id, id: r.id, name: r.name, disabled: r.disabled, config: r.config });
      if (Array.isArray(r.config)) walk(r.config, path + "/" + r.id);
    }
  })(plugins, "");
  for (const f of flat) if (/compaction|magic/.test(f.id)) {
    console.log(`  ${f.path}: name=${f.name} disabled=${f.disabled} config=${JSON.stringify(f.config)}`);
  }
  console.log(`  total plugin rows: ${flat.length}, enabled: ${flat.filter(f => f.disabled !== true).length}`);
}

console.log("\n=== other bundles' insert rows that matter ===");
for (const id of order) {
  if (/^bili|^magic|^dsh-market|dshmarket/.test(id)) {
    const r = rows.get(id);
    console.log(`  ${id}: name=${r.name} disabled=${r.disabled}`);
  }
}
