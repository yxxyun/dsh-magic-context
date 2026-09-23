/**
 * audit-dsh-api — diff the DSH API surface this plugin USES against the API the
 * installed runtime actually EXPOSES.
 *
 * WHY. The fork compiles against @deepseek-ai/* 0.1.0-rc.6 type stubs while the
 * desktop runtime is 0.1.7-alpha.2. That drift is invisible to tsc and cost a
 * full debugging session: the plugin read `session.events` (a property the
 * stubs declare) but the runtime only has `session.snapshotEvents()` (a method),
 * so `for...of undefined` threw on every session's first pre-step and silently
 * disabled the entire context plane.
 *
 * This makes the drift visible. Extract the runtime's real members, extract what
 * the plugin accesses, and report:
 *   - MISSING : the plugin reads a member the runtime does not have  (a bug)
 *   - extra   : the runtime has members the plugin never uses         (informational)
 *
 * Usage:
 *   bun run tools/audit-dsh-api.mjs                 # session + agent surface
 *   bun run tools/audit-dsh-api.mjs --runtime <dir> # use extracted runtime js
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(FORK_ROOT, "packages", "dsh-plugin", "src");
const RUNTIME_DIR = "D:\\dsh-tmp";

/** Members declared on a class: getters, methods, and `this.x =` assignments. */
function classMembers(js) {
  const members = new Set();
  // The runtime bundles are TAB-indented, so anchor on "some whitespace" rather
  // than a fixed width — a `\s{4}` anchor silently missed every prototype
  // getter and method and reported them all as drift.
  const IND = "[ \\t]+";
  for (const m of js.matchAll(new RegExp(`^${IND}(?:static\\s+)?(?:async\\s+)?get\\s+([A-Za-z_$][\\w$]*)\\s*\\(`, "gm"))) {
    members.add(m[1]);
  }
  // Deliberately loose: do NOT require the parameter list to close before `{`,
  // because signatures like `snapshotEvents(fromSeq = SessionLogOffset(0), …)`
  // contain nested parens and a `[^)]*` pattern silently missed them.
  for (const m of js.matchAll(new RegExp(`^${IND}(?:static\\s+)?(?:async\\s+)?([A-Za-z_$][\\w$]*)\\s*\\(`, "gm"))) {
    members.add(m[1]);
  }
  for (const m of js.matchAll(/this\.([A-Za-z_$][\w$]*)\s*=/g)) members.add(m[1]);
  return members;
}

/** Every `expr.member` access in the plugin's TypeScript, per receiver name. */
function pluginAccesses() {
  const files = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".ts") && !p.endsWith(".test.ts")) files.push(p);
    }
  })(SRC);

  // receiver -> member -> example "file:line"
  const out = new Map();
  const RE = /\b(session|agent)\.([A-Za-z_$][\w$]*)/g;
  for (const file of files) {
    // Blank out comments WITHOUT removing their newlines, so prose that merely
    // mentions a member is not counted as a use and reported line numbers stay
    // accurate.
    const text = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/\/\/[^\n]*/g, "");
    text.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(RE)) {
        const [, recv, member] = m;
        if (!out.has(recv)) out.set(recv, new Map());
        if (!out.get(recv).has(member)) {
          out.get(recv).set(member, `${file.slice(FORK_ROOT.length + 1)}:${i + 1}`);
        }
      }
    });
  }
  return out;
}

const runtime = (file) => {
  try {
    return readFileSync(join(RUNTIME_DIR, file), "utf8");
  } catch {
    console.error(`error: cannot read ${join(RUNTIME_DIR, file)} — extract it first with tools/asar2.mjs`);
    process.exit(2);
  }
};

// The runtime session and agent implementations, straight out of app.asar.
const sessionApi = classMembers(runtime("dsh-session.js"));
const agentApi = classMembers(runtime("agent-loop.js"));
agentApi.add("id");
agentApi.add("options");
agentApi.add("session");
agentApi.add("inject");

const accesses = pluginAccesses();
const runtimeFor = { session: sessionApi, agent: agentApi };

let problems = 0;
for (const [recv, members] of accesses) {
  const available = runtimeFor[recv];
  if (!available) continue;
  console.log(`\n=== ${recv}.* (${members.size} members used by the plugin) ===`);
  const missing = [];
  for (const [member, where] of [...members].sort()) {
    if (available.has(member)) continue;
    // `session.id` / `agent.id` exist on the SessionId-bearing wrapper.
    missing.push([member, where]);
  }
  if (missing.length === 0) {
    console.log("  all used members exist in the runtime");
  } else {
    problems += missing.length;
    for (const [member, where] of missing) {
      console.log(`  MISSING  ${recv}.${member}   (used at ${where})`);
    }
  }
}

console.log(`\nruntime ${"session"} members: ${[...sessionApi].sort().join(", ")}`);
console.log(`\n${problems === 0 ? "OK: no missing members." : `${problems} missing member(s) — these are the drift bugs.`}`);
