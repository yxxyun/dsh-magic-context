// Populate a DSH profile with the packages Magic Context's local embeddings need,
// by copying them out of this repo's own bun store.
//
// WHY THIS EXISTS (all measured on this machine, 2026-09-24):
//   - `pnpm install` in the profile cannot do it: the 138 MB onnxruntime-web
//     tarball times out at pnpm's default fetch timeout, and the install aborts
//     with EPERM renaming node_modules/platform while DSH holds files open.
//   - The packages are already downloaded here, because the vendored upstream
//     core declares @huggingface/transformers (which itself depends on
//     onnxruntime-node, onnxruntime-web and sharp), so bun's store has them.
//   - fs.cpSync(recursive) throws EIO on this repo's non-ASCII Windows path and
//     fs.rmSync silently no-ops there, so copying and cleanup are hand-rolled.
//
// WHAT IT DOES NOT DO: update pnpm's lockfile. The profile's bookkeeping still
// needs a real `pnpm install` with DSH closed; this exists so the runtime works
// meanwhile — and so a pnpm run that prunes these copies can be repaired.
//
// USAGE
//   bun run tools/install-embedding-deps.mjs [--store <dir>] [--target <dir>]
//     --store   bun store to copy FROM (default: <repo>/node_modules/.bun)
//     --target  node_modules to copy INTO (default: the desktop profile's)
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const STORE = argValue("--store") ?? join(REPO_ROOT, "node_modules", ".bun");
const TARGET =
  argValue("--target") ??
  join(homedir(), ".dsh", "profiles", "desktop", "node_modules");

// Roots: the runtime dependencies the shipped manifest declares. Everything else
// comes in through their own dependency graphs.
const ROOTS = ["@huggingface/transformers", "onnxruntime-web"];

/** `.bun/<name>@<version>/node_modules/<name>` — bun's isolated store layout. */
function storeDir(name) {
  const prefix = name.replace("/", "+") + "@";
  let entries;
  try {
    entries = readdirSync(STORE);
  } catch {
    return null;
  }
  const hit = entries.find((entry) => entry.startsWith(prefix));
  if (hit === undefined) return null;
  const dir = join(STORE, hit, "node_modules", ...name.split("/"));
  return existsSync(dir) ? dir : null;
}

function removeTree(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (lstatSync(full).isDirectory()) removeTree(full);
    else unlinkSync(full);
  }
  rmdirSync(dir);
}

function copyTree(src, dest) {
  if (statSync(src).isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) copyTree(join(src, entry), join(dest, entry));
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

const seen = new Set();
const copied = [];
const kept = [];
const missing = [];

function visit(name) {
  if (seen.has(name)) return;
  seen.add(name);
  const src = storeDir(name);
  if (src === null) {
    missing.push(name);
    return;
  }
  const dest = join(TARGET, ...name.split("/"));
  if (existsSync(join(dest, "package.json"))) {
    kept.push(name);
  } else {
    removeTree(dest);
    copyTree(src, dest);
    copied.push(name);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(src, "package.json"), "utf8"));
  } catch {
    return;
  }
  for (const dep of Object.keys(manifest.dependencies ?? {})) visit(dep);
  // optionalDependencies matter: sharp's native platform binary lives there, and
  // without it sharp cannot load (which is what broke local embeddings).
  for (const dep of Object.keys(manifest.optionalDependencies ?? {})) visit(dep);
}

console.log(`store : ${STORE}`);
console.log(`target: ${TARGET}`);
if (!existsSync(STORE)) {
  console.error("error: the bun store does not exist — run `bun install` in the repo first.");
  process.exit(2);
}
for (const root of ROOTS) visit(root);

console.log(`\ncopied        (${copied.length}): ${copied.join(", ") || "-"}`);
console.log(`already there (${kept.length}): ${kept.join(", ") || "-"}`);
if (missing.length > 0) {
  // Other platforms' optional binaries are expected to be absent; say so rather
  // than pretending the copy was complete.
  console.log(`not in store  (${missing.length}): ${missing.join(", ")}`);
}

// Proof: the shipped entry chunk must be able to resolve every external the
// build left for the runtime.
const entry = join(TARGET, "dsh-magic-context", "dist", "entries", "agent.js");
if (!existsSync(entry)) {
  console.error(`\nFAIL: ${entry} is missing — deploy the plugin first (tools/deploy-to-profile.mjs).`);
  process.exit(2);
}
const requireFn = createRequire(entry);
let unresolved = 0;
console.log("\nresolution from the entry chunk:");
for (const spec of ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web", "sharp"]) {
  try {
    requireFn.resolve(spec);
    console.log(`  ok      ${spec}`);
  } catch {
    unresolved++;
    console.log(`  MISSING ${spec}`);
  }
}
console.log(
  unresolved === 0
    ? "\nverdict: CLEAN — every runtime external resolves"
    : `\nverdict: ${unresolved} runtime external(s) unresolved`,
);
process.exit(unresolved === 0 ? 0 : 1);
