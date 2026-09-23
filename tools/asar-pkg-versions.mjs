/**
 * asar-pkg-versions — list the @deepseek-ai packages (and versions) baked into
 * the desktop runtime, so the fork can compile against what actually runs.
 *
 * Usage: bun run tools/asar-pkg-versions.mjs [filter]
 */
import { readFileSync } from "node:fs";

const ASAR = process.env.DSH_ASAR || "D:/DeepSeekHarness/resources/app.asar";
const filter = process.argv[2] || "@deepseek-ai/";

const buf = readFileSync(ASAR);
const headerSize = buf.readUInt32LE(4);
const headerBuf = buf.subarray(8, 8 + headerSize).toString("utf8");
const start = headerBuf.indexOf('{"files"');
let depth = 0;
let end = -1;
let inStr = false;
let esc = false;
for (let i = start; i < headerBuf.length; i++) {
  const c = headerBuf[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = false;
    continue;
  }
  if (c === '"') inStr = true;
  else if (c === "{") depth++;
  else if (c === "}") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
const json = JSON.parse(headerBuf.slice(start, end));
const BASE = 8 + headerSize;

function getNode(p) {
  let n = json;
  for (const part of p.split("/")) {
    if (!n.files) return undefined;
    n = n.files[part];
  }
  return n;
}
function raw(p) {
  const n = getNode(p);
  if (!n) return undefined;
  const off = parseInt(n.offset, 10);
  return buf.subarray(BASE + off, BASE + off + n.size);
}

const found = [];
(function walk(node, prefix) {
  for (const [k, v] of Object.entries(node.files || {})) {
    const p = prefix ? `${prefix}/${k}` : k;
    if (v.files) walk(v, p);
    else if (p.endsWith("package.json") && p.includes("node_modules/")) found.push(p);
  }
})(json, "");

const rows = [];
for (const p of found) {
  const r = raw(p);
  if (!r) continue;
  try {
    const pkg = JSON.parse(r.toString("utf8"));
    if (!pkg.name || !pkg.name.startsWith(filter)) continue;
    rows.push({ name: pkg.name, version: pkg.version ?? "?" , path: p });
  } catch {
    // not JSON — skip
  }
}

rows.sort((a, b) => a.name.localeCompare(b.name));
console.log(`${rows.length} package(s) matching ${filter}`);
for (const r of rows) console.log(`  ${r.name.padEnd(46)} ${r.version}`);

const versions = {};
for (const r of rows) (versions[r.version] ??= []).push(r.name);
console.log("\nversion histogram:");
for (const [v, names] of Object.entries(versions).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(v).padEnd(20)} ${names.length} package(s)`);
}
