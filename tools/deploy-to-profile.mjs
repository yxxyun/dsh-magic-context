#!/usr/bin/env bun
/**
 * deploy-to-profile — publish this fork's built plugin into a DSH profile.
 *
 * WHY THIS EXISTS
 *
 * Two Windows/pnpm quirks make the naive deploy fail, and both cost real
 * debugging time, so they are encoded here instead of living in someone's shell
 * history:
 *
 *   1. `workspace:*` must not reach the installed manifest. The source
 *      packages/dsh-plugin/package.json depends on the workspace-internal
 *      `@magic-context/core` and `dsh-magic-context-adapter`, which the bun
 *      workspace links locally. But the profile is a SEPARATE single-package
 *      pnpm workspace, so a `file:` dependency whose manifest says
 *      `workspace:*` makes pnpm abort with ERR_PNPM_WORKSPACE_PKG_NOT_FOUND —
 *      which also makes the GUI's plugin uninstall/install fail, with a message
 *      that points nowhere near the cause. The bundle's dist is self-contained
 *      (it imports neither), so the staged artifact ships with no runtime
 *      `dependencies` at all; the host supplies the shared packages through
 *      peerDependencies.
 *
 *   2. `fs.cpSync(..., {recursive:true})` throws EIO on Windows when the
 *      DESTINATION path contains non-ASCII characters — and the profile lives
 *      under `C:\Users\<CJK-name>\.dsh\...`. Single-file copies and mkdir are
 *      fine, so this script recurses manually rather than using cpSync.
 *
 * USAGE
 *
 *   bun run tools/deploy-to-profile.mjs                 # default desktop profile
 *   bun run tools/deploy-to-profile.mjs --install <dir>  # explicit install dir
 *   bun run tools/deploy-to-profile.mjs --stage-only     # refresh stage/ only
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const FORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(FORK_ROOT, "packages", "dsh-plugin");
const STAGE = join(FORK_ROOT, "stage", "dsh-magic-context");
const PKG_NAME = "dsh-magic-context";

const argv = process.argv.slice(2);
const installIdx = argv.indexOf("--install");
const stageOnly = argv.includes("--stage-only");
const installDir =
  installIdx >= 0
    ? resolve(argv[installIdx + 1])
    : join(process.env.DSH_HOME?.trim() || join(homedir(), ".dsh"),
        "profiles", "desktop", "node_modules", PKG_NAME);

/** Files that form the publishable payload (mirrors package.json `files`). */
const PAYLOAD = ["dist", "src", "cordis.patch.yml", "NOTICE"];

/**
 * Recursive copy that replaces `dest`. Avoids fs.cpSync, whose Windows
 * non-ASCII-destination EIO is the whole reason this is hand-rolled.
 */
function copyTree(src, dest) {
  const st = statSync(src);
  if (st.isDirectory()) {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) copyTree(join(src, entry), join(dest, entry));
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/**
 * Build the manifest that ships in the profile: everything the loader needs,
 * minus the workspace-only `dependencies` and the build-only `devDependencies`
 * and `scripts`.
 */
function publishableManifest(srcManifest) {
  const keep = [
    "name", "version", "type", "description", "main", "types", "bin",
    "exports", "license", "files", "peerDependencies", "dsh",
  ];
  const out = {};
  for (const key of keep) if (srcManifest[key] !== undefined) out[key] = srcManifest[key];
  out.dependencies = {};
  return out;
}

// --- preflight -------------------------------------------------------------
if (!existsSync(join(SRC, "dist", "index.js"))) {
  console.error(`error: ${join(SRC, "dist", "index.js")} is missing — run \`bun run build\` first.`);
  process.exit(1);
}
const srcManifest = JSON.parse(readFileSync(join(SRC, "package.json"), "utf8"));
const workspaceDeps = Object.entries(srcManifest.dependencies ?? {})
  .filter(([, v]) => String(v).startsWith("workspace:"))
  .map(([k]) => k);

console.log(`source : ${SRC}`);
console.log(`stage  : ${STAGE}`);
console.log(`install: ${stageOnly ? "(skipped)" : installDir}`);
if (workspaceDeps.length) {
  console.log(`note   : stripping workspace-only deps from the shipped manifest: ${workspaceDeps.join(", ")}`);
}

// --- 1. refresh stage ------------------------------------------------------
mkdirSync(STAGE, { recursive: true });
for (const item of PAYLOAD) {
  const from = join(SRC, item);
  if (!existsSync(from)) {
    console.error(`error: payload item missing: ${from}`);
    process.exit(1);
  }
  copyTree(from, join(STAGE, item));
}
writeFileSync(join(STAGE, "package.json"), JSON.stringify(publishableManifest(srcManifest), null, 2) + "\n", "utf8");
console.log(`stage  : refreshed (${PAYLOAD.join(", ")}, package.json rewritten)`);

// --- 2. install into the profile ------------------------------------------
if (!stageOnly) {
  if (!existsSync(installDir)) {
    console.error(
      `\nerror: ${installDir} does not exist.\n` +
      `A profile package must be created by pnpm first (it links the shared host packages).\n` +
      `Add it to the profile manifest and run pnpm install there, then re-run this script.`,
    );
    process.exit(1);
  }
  for (const item of PAYLOAD) copyTree(join(STAGE, item), join(installDir, item));
  copyFileSync(join(STAGE, "package.json"), join(installDir, "package.json"));
  console.log(`install: deployed (${PAYLOAD.join(", ")}, package.json)`);
}

// --- 3. verify -------------------------------------------------------------
const stageManifest = JSON.parse(readFileSync(join(STAGE, "package.json"), "utf8"));
console.log(`\nstaged manifest dependencies: ${JSON.stringify(stageManifest.dependencies)}`);
if (!stageOnly) {
  const instManifest = JSON.parse(readFileSync(join(installDir, "package.json"), "utf8"));
  const ws = Object.entries(instManifest.dependencies ?? {}).filter(([, v]) => String(v).startsWith("workspace:"));
  const client = join(installDir, "src", "client", "client.js");
  console.log(`installed manifest dependencies: ${JSON.stringify(instManifest.dependencies)}`);
  console.log(`client entry present: ${existsSync(client)}`);
  if (ws.length) {
    console.error(`\nFAIL: installed manifest still carries workspace deps (${ws.map(([k]) => k).join(", ")}) — pnpm install will fail.`);
    process.exit(1);
  }
  console.log("\nOK. The profile should now install cleanly; run `pnpm install` there to confirm.");
}
