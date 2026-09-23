// Compose the real profile's entry list the way boot() does, using the
// corrected asar reads, and report whether the Magic preset override applies
// cleanly. This validates the patch against the ACTUAL shipped rows without
// touching the live profile.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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

function getNode(p) {
  let n = json;
  for (const part of p.split("/")) { if (!n.files) return undefined; n = n.files[part]; }
  return n;
}
function asarText(p) {
  const n = getNode(p);
  if (!n) return undefined;
  const off = parseInt(n.offset, 10);
  return buf.subarray(BASE + off, BASE + off + n.size).toString("utf8");
}

const JsExpr = new yaml.Type("tag:yaml.org,2002:js", {
  kind: "scalar", resolve: (d) => typeof d === "string",
  construct: (d) => ({ __jsExpr: d }),
});
const schema = yaml.JSON_SCHEMA.extend(JsExpr);

// Import the plugin's own patch engine (the loader's algorithm).
const include = await import(pathToFileURL(resolve("../node_modules/@deepseek-ai/cordis-plugin-include/lib/index.js")).href)
  .catch(() => null);

const webapp = getNode("dsh/node_modules/@deepseek-ai/dsh-web-app/package.json");
const bundleFiles = webapp ? JSON.parse(asarText("dsh/node_modules/@deepseek-ai/dsh-web-app/package.json")).dsh.bundle.patch : null;
console.log("web-app dsh.bundle.patch:", JSON.stringify(bundleFiles));

const profileDir = "C:/Users/杨新鑫/.dsh/profiles/desktop";
const profilePkg = JSON.parse(readFileSync(join(profileDir, "package.json"), "utf8"));
console.log("profile bundles:", JSON.stringify(profilePkg.dsh.profile.bundles));

// Collect patch layers in order: each bundle's declared patches, then the
// profile's own cordis.patch.yml.
const layers = [];
const addPatch = (label, text, file) => {
  try {
    const rows = yaml.load(text, { schema });
    if (!Array.isArray(rows)) { console.log(`  ! ${label}: not an array`); return; }
    layers.push({ label, file, rows });
    console.log(`  ok ${label}: ${rows.length} row(s)`);
  } catch (e) {
    console.log(`  ! ${label}: PARSE FAILED ${String(e.message).split("\n")[0]}`);
  }
};

console.log("\n=== bundle patch layers (asar) ===");
addPatch("dsh-base/cordis.patch.yml", asarText("dsh/node_modules/@deepseek-ai/dsh-base/cordis.patch.yml"));
for (const f of bundleFiles ?? []) {
  const p = "dsh/node_modules/@deepseek-ai/dsh-web-app/" + f.replace(/^\.\//, "");
  addPatch(f, asarText(p));
}

console.log("\n=== profile user layer ===");
const profPatch = join(profileDir, "cordis.patch.yml");
if (existsSync(profPatch)) addPatch("profile cordis.patch.yml", readFileSync(profPatch, "utf8"));
else console.log("  (none)");

console.log("\n=== installed third-party bundles (from profile node_modules) ===");
for (const name of profilePkg.dsh.profile.bundles) {
  if (name.startsWith("@deepseek-ai/")) continue;
  const dir = join(profileDir, "node_modules", name);
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) { console.log(`  ! ${name}: not installed`); continue; }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const decl = pkg.dsh?.bundle?.patch;
  if (!decl) { console.log(`  ! ${name}: declares no dsh.bundle.patch`); continue; }
  const files = typeof decl === "string" ? [decl] : decl;
  for (const f of files) {
    const p = join(dir, f);
    if (!existsSync(p)) { console.log(`  ! ${name} -> ${f}: MISSING FILE`); continue; }
    addPatch(`${name} -> ${f}`, readFileSync(p, "utf8"));
  }
}

// Fold every layer into one patch list and apply to the base config in order.
// The base entry list is dsh-base's insert rows (composeEntries handles this),
// but for preset-override validation the relevant question is whether the
// preset-standard row exists among the inserted rows and whether our override
// targets it by id.
console.log("\n=== preset-standard declarations across layers ===");
for (const l of layers) {
  const walk = (rows) => {
    for (const r of rows) {
      if (r.insert) walk(r.insert);
      else if (r.id && String(r.id).startsWith("preset-")) {
        console.log(`  ${l.label}: id=${r.id} name=${r.name} plugins=${Array.isArray(r.config?.plugins) ? r.config.plugins.length : "(none)"}`);
      }
    }
  };
  walk(l.rows);
}

// Magic's override must be the LAST declaration of preset-standard.
console.log("\n=== final effective preset-standard (last wins) ===");
let winner = null;
for (const l of layers) {
  const walk = (rows) => {
    for (const r of rows) {
      if (r.insert) walk(r.insert);
      else if (r.id === "preset-standard") winner = { layer: l.label, row: r };
    }
  };
  walk(l.rows);
}
if (!winner) console.log("  ! NO preset-standard row declared anywhere");
else {
  console.log(`  declared by: ${winner.layer}`);
  console.log(`  name: ${winner.row.name}`);
  const plugins = winner.row.config?.plugins ?? [];
  console.log(`  plugins: ${plugins.length} rows`);
  const flat = [];
  const walkP = (list, path) => {
    for (const r of list) {
      flat.push({ path: path + "/" + r.id, id: r.id, name: r.name, disabled: r.disabled });
      if (Array.isArray(r.config)) walkP(r.config, path + "/" + r.id);
    }
  };
  walkP(plugins, "");
  const enabled = flat.filter((r) => r.disabled !== true);
  console.log(`  enabled rows: ${enabled.length}`);
  console.log(`  magic rows: ${flat.filter((r) => String(r.id).startsWith("magic-")).map((r) => r.id + "=" + r.disabled).join(", ") || "(none)"}`);
  const basic = flat.find((r) => r.id === "compaction-basic");
  console.log(`  compaction-basic disabled: ${basic ? basic.disabled : "(absent)"}`);
  const mgc = flat.find((r) => r.id === "magic-compaction");
  console.log(`  magic-compaction present: ${mgc ? "yes" : "NO"}`);
}
