#!/usr/bin/env bun
/**
 * port-upstream-migrations — raise this fork's Magic Context schema lane to an
 * upstream release, in one command.
 *
 * WHY THIS EXISTS
 *
 * The fork vendors upstream's core and shares ONE SQLite database
 * (`~/.local/share/cortexkit/magic-context/context.db`) with the OpenCode build
 * of Magic Context. `storage-db.ts` fails CLOSED when the on-disk schema lane is
 * newer than the binary supports, so the moment the OpenCode side migrates to
 * v(N+1) every DSH session silently loses storage: the bundle still loads and
 * the ctx_* tools still register, but each call returns "Magic Context database
 * is not available (host bootstrap not ready)".
 *
 * Closing that gap by hand means re-deriving a migration delta PLUS the
 * transitive closure of top-level helpers it depends on, from a fresh clone.
 * That is easy to get subtly wrong — the manual v76→v85 port duplicated
 * `deleteLosingOpenCode2Twin` and broke the typecheck.
 *
 * WHAT THIS DOES
 *
 *   1. clones upstream at the requested tag (cached between runs);
 *   2. compares both schema ceilings and reports the gap;
 *   3. extracts every MIGRATIONS entry newer than ours;
 *   4. computes the transitive closure of top-level helpers that delta needs,
 *      excluding anything we already define (no duplicates);
 *   5. splices both in before the array terminator / before
 *      `ensureMigrationsTable`, and raises LATEST_SUPPORTED_VERSION;
 *   6. prints the follow-up verification commands.
 *
 * Idempotent: re-running after a successful port detects the newest migration is
 * already present and exits 0 without touching the tree.
 *
 * USAGE
 *
 *   bun run tools/port-upstream-migrations.mjs v0.43.0            # dry run
 *   bun run tools/port-upstream-migrations.mjs v0.43.0 --apply    # write
 *   bun run tools/port-upstream-migrations.mjs --list             # upstream tags
 *
 * The clone cache defaults to `$MC_UPSTREAM_CACHE` or `<tmpdir>/mc-upstream`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const UPSTREAM_URL = "https://github.com/cortexkit/magic-context.git";
const FORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MC_REL = join("packages", "plugin", "src", "features", "magic-context");
const MIGRATIONS_REL = join(MC_REL, "migrations.ts");
const STORAGE_REL = join(MC_REL, "storage-db.ts");

const HELPERS_ANCHOR = "function ensureMigrationsTable(db: Database): void {";
const FENCE_RE = /export const LATEST_SUPPORTED_VERSION = (\d+);/;
const VERSION_RE = /^\s*version:\s*(\d+),/m;

// ---------------------------------------------------------------------------
// tiny io helpers
// ---------------------------------------------------------------------------

const log = (msg) => console.log(msg);
const fail = (msg) => {
  console.error(`error: ${msg}`);
  process.exit(1);
};

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

// ---------------------------------------------------------------------------
// string/comment-aware scanner — everything below relies on this being correct,
// because a naive brace counter trips over braces inside SQL template literals
// and comments, both of which are everywhere in migrations.ts.
// ---------------------------------------------------------------------------

function skipQuoted(src, i) {
  const quote = src[i];
  i += 1;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === quote) return i + 1;
    i += 1;
  }
  return i;
}

function skipTrivia(src, i) {
  // returns [nextIndex, skipped] — advances past comments only
  if (src[i] === "/" && src[i + 1] === "/") {
    const nl = src.indexOf("\n", i);
    return [nl < 0 ? src.length : nl + 1, true];
  }
  if (src[i] === "/" && src[i + 1] === "*") {
    const end = src.indexOf("*/", i);
    return [end < 0 ? src.length : end + 2, true];
  }
  return [i, false];
}

/** Index just past the end of the top-level statement starting at `start`. */
function statementEnd(src, start, kind) {
  const advance = (i) => {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") return skipQuoted(src, i);
    const [ni, skipped] = skipTrivia(src, i);
    return skipped ? ni : i + 1;
  };

  if (kind === "function") {
    // Find the BODY's opening brace first. Tracking paren depth is essential:
    // the `)` that closes the parameter list also closes depth to zero, so a
    // naive depth check ends the statement at the signature. Destructured
    // params (`function f({a}: T)`) are braces *inside* parens and must not
    // be mistaken for the body.
    let i = start;
    let paren = 0;
    let body = -1;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'" || c === "`") {
        i = skipQuoted(src, i);
        continue;
      }
      const [ni, skipped] = skipTrivia(src, i);
      if (skipped) {
        i = ni;
        continue;
      }
      if (c === "(") paren += 1;
      else if (c === ")") paren -= 1;
      else if (c === "{") {
        if (paren === 0) {
          body = i;
          break;
        }
      } else if (c === ";" && paren === 0) {
        return i + 1; // declaration without a body
      }
      i += 1;
    }
    if (body < 0) return src.length;

    let depth = 0;
    i = body;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'" || c === "`") {
        i = skipQuoted(src, i);
        continue;
      }
      const [ni, skipped] = skipTrivia(src, i);
      if (skipped) {
        i = ni;
        continue;
      }
      if (c === "{") depth += 1;
      else if (c === "}") {
        depth -= 1;
        if (depth === 0) return i + 1;
      }
      i += 1;
    }
    return src.length;
  }

  // const/let/var: run to the terminating `;` at nesting depth zero, so
  // `[...] as const;` keeps its suffix.
  let i = start;
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipQuoted(src, i);
      continue;
    }
    const [ni, skipped] = skipTrivia(src, i);
    if (skipped) {
      i = ni;
      continue;
    }
    if (c === "{" || c === "(" || c === "[") depth += 1;
    else if (c === "}" || c === ")" || c === "]") depth -= 1;
    else if (c === ";" && depth <= 0) return i + 1;
    i += 1;
  }
  return src.length;
}

/** All top-level `function`/`const` definitions in a module, by name. */
function topLevelDefs(src) {
  const defs = new Map();
  const re = /^(?:export\s+)?(function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, kind, name] = m;
    if (defs.has(name)) continue;
    const start = m.index;
    const end = statementEnd(src, start, kind === "function" ? "function" : "const");
    defs.set(name, { name, start, end, text: src.slice(start, end) });
  }
  return defs;
}

/** Entries of the `MIGRATIONS` array literal, in order. */
function migrationEntries(src) {
  const anchor = src.indexOf("export const MIGRATIONS");
  if (anchor < 0) fail("MIGRATIONS array not found in upstream migrations.ts");
  // The declaration is `export const MIGRATIONS: Migration[] = [`, so the FIRST
  // `[` belongs to the type annotation. Anchor the scan on the `=` instead.
  const eq = src.indexOf("=", anchor);
  if (eq < 0) fail("MIGRATIONS declaration has no initializer");
  const open = src.indexOf("[", eq);
  if (open < 0) fail("MIGRATIONS initializer is not an array literal");
  const entries = [];
  let i = open + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipQuoted(src, i);
      continue;
    }
    const [ni, skipped] = skipTrivia(src, i);
    if (skipped) {
      i = ni;
      continue;
    }
    if (c === "]") break;
    if (c === "{") {
      const end = statementEnd(src, i, "function");
      const text = src.slice(i, end);
      const v = text.match(VERSION_RE);
      if (v) entries.push({ version: Number(v[1]), text });
      i = end;
      continue;
    }
    i += 1;
  }
  return entries;
}

const ceiling = (src) => {
  const m = src.match(FENCE_RE);
  return m ? Number(m[1]) : null;
};

// ---------------------------------------------------------------------------
// dependency closure
// ---------------------------------------------------------------------------

/**
 * Names referenced as calls or bare identifiers inside `text`, minus a small
 * stop-list of JS builtins and SQL/keyword noise. Over-collecting is harmless
 * (unknown names are dropped); under-collecting is the failure mode we care
 * about, so this errs toward inclusion.
 */
const STOP = new Set([
  "if", "for", "while", "switch", "catch", "return", "typeof", "instanceof", "new",
  "delete", "void", "in", "of", "do", "else", "try", "finally", "throw", "case",
  "break", "continue", "function", "const", "let", "var", "class", "await", "async",
  "yield", "this", "super", "null", "undefined", "true", "false",
  "Number", "String", "Boolean", "Array", "Object", "JSON", "Date", "Math", "Set",
  "Map", "Promise", "Error", "RegExp", "BigInt", "Symbol", "parseInt", "parseFloat",
  "isNaN", "require", "import", "export", "default", "from", "as", "type",
  "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TABLE",
  "INDEX", "INTO", "FROM", "WHERE", "VALUES", "AND", "OR", "NOT", "EXISTS",
  "PRAGMA", "BEGIN", "COMMIT", "ROLLBACK", "UNION", "JOIN", "LEFT", "INNER",
  "ORDER", "GROUP", "BY", "LIMIT", "OFFSET", "SET", "IF", "ROWID", "NULL",
  "TEXT", "INTEGER", "REAL", "BLOB", "PRIMARY", "KEY", "UNIQUE", "DEFAULT",
]);

function referencedNames(text) {
  const names = new Set();
  for (const m of text.matchAll(/([A-Za-z_$][\w$]*)/g)) {
    const name = m[1];
    if (STOP.has(name)) continue;
    const before = text.slice(Math.max(0, m.index - 4), m.index);
    if (/[\w$]$/.test(before)) continue; // tail of a longer identifier
    // `obj.prop` is property access, but `...spread` must NOT be skipped: a
    // lookbehind that simply rejects a preceding "." loses every spread
    // reference, which is exactly how the v85 table constants went missing.
    if (/\.$/.test(before) && !/\.\.$/.test(before)) continue;
    names.add(name);
  }
  return names;
}

/**
 * Transitive closure of top-level upstream defs that `seeds` need and that the
 * local module does not already define. Returns defs sorted by their position in
 * upstream so the emitted block reads in source order.
 */
function helperClosure(upstreamSrc, localSrc, seeds) {
  const upDefs = topLevelDefs(upstreamSrc);
  const localDefs = topLevelDefs(localSrc);
  const wanted = new Map();

  const visit = (names, origin) => {
    for (const name of names) {
      if (wanted.has(name)) continue;
      if (localDefs.has(name)) continue; // already ours — never duplicate
      const def = upDefs.get(name);
      if (!def) continue; // a builtin, a local param, or SQL noise
      wanted.set(name, def);
      visit(referencedNames(def.text), name);
    }
  };
  visit(seeds, "<delta>");

  return [...wanted.values()].sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const listOnly = argv.includes("--list");
const cacheIdx = argv.indexOf("--cache");
const cacheDir =
  cacheIdx >= 0
    ? resolve(argv[cacheIdx + 1])
    : process.env.MC_UPSTREAM_CACHE || join(tmpdir(), "mc-upstream");
const tag = argv.find((a) => !a.startsWith("--") && a !== argv[cacheIdx + 1]);

const localMigrationsPath = join(FORK_ROOT, MIGRATIONS_REL);
const localStoragePath = join(FORK_ROOT, STORAGE_REL);
if (!existsSync(localMigrationsPath)) fail(`not a fork checkout: ${localMigrationsPath} missing`);

if (listOnly) {
  const out = git(["ls-remote", "--sort=-v:refname", "--tags", UPSTREAM_URL]);
  const tags = out
    .split("\n")
    .map((l) => l.split("refs/tags/")[1])
    .filter((t) => t && !t.endsWith("^{}"))
    .slice(0, 12);
  log("recent upstream tags:");
  for (const t of tags) log(`  ${t}`);
  process.exit(0);
}

if (!tag) fail("usage: port-upstream-migrations.mjs <tag> [--apply] [--list] [--cache <dir>]");

// --- 1. fetch upstream at the requested tag --------------------------------
log(`upstream : ${UPSTREAM_URL} @ ${tag}`);
if (existsSync(join(cacheDir, ".git"))) {
  try {
    git(["fetch", "--depth", "1", "origin", "tag", tag], cacheDir);
    git(["checkout", "--force", `FETCH_HEAD`], cacheDir);
  } catch {
    log("  (cached clone is stale — refetching from scratch)");
    rmSync(cacheDir, { recursive: true, force: true });
  }
}
if (!existsSync(join(cacheDir, ".git"))) {
  rmSync(cacheDir, { recursive: true, force: true });
  git(["clone", "--depth", "1", "--branch", tag, UPSTREAM_URL, cacheDir], dirname(cacheDir));
}
log(`clone    : ${cacheDir}`);

const upMigrationsPath = join(cacheDir, MIGRATIONS_REL);
const upStoragePath = join(cacheDir, STORAGE_REL);
if (!existsSync(upMigrationsPath)) fail(`upstream layout changed: ${upMigrationsPath} missing`);

const upMigrations = readFileSync(upMigrationsPath, "utf8");
const upStorage = readFileSync(upStoragePath, "utf8");
let localMigrations = readFileSync(localMigrationsPath, "utf8");
let localStorage = readFileSync(localStoragePath, "utf8");

// --- 2. compare ceilings ---------------------------------------------------
const upCeiling = ceiling(upStorage);
const localCeiling = ceiling(localStorage);
if (upCeiling === null) fail("could not read upstream LATEST_SUPPORTED_VERSION");
if (localCeiling === null) fail("could not read local LATEST_SUPPORTED_VERSION");
log(`ceilings : upstream v${upCeiling}  local v${localCeiling}`);

if (upCeiling <= localCeiling) {
  log(`\nalready current — nothing to port (local v${localCeiling} >= upstream v${upCeiling}).`);
  process.exit(0);
}

const localVersions = new Set(
  [...localMigrations.matchAll(/^\s*version:\s*(\d+),/gm)].map((m) => Number(m[1])),
);
const localMax = Math.max(...localVersions);

// --- 3. extract newer migrations ------------------------------------------
const newEntries = migrationEntries(upMigrations).filter((e) => e.version > localMax);
if (newEntries.length === 0) fail("ceilings differ but upstream has no newer MIGRATIONS entries");

// Entries are extracted from `{` to the matching `}`, which EXCLUDES the
// trailing comma — re-add it between entries or the array literal is invalid.
const deltaText = newEntries.map((e) => "    " + e.text.trim()).join(",\n\n");
log(`\nporting  : v${localMax + 1}..v${upCeiling}  (${newEntries.length} migration(s))`);
for (const e of newEntries) {
  const desc = e.text.match(/description:\s*"([^"]+)"/);
  log(`  v${String(e.version).padStart(3)}  ${desc ? desc[1] : "(no description)"}`);
}

// --- 4. helper closure -----------------------------------------------------
const seeds = referencedNames(deltaText);
const helpers = helperClosure(upMigrations, localMigrations, seeds);
log(`\nhelpers  : ${helpers.length} top-level def(s) needed, not already present`);
for (const h of helpers) log(`  ${h.name}`);

if (process.env.MC_PORT_DEBUG) {
  const upDefs = topLevelDefs(upMigrations);
  const localDefs = topLevelDefs(localMigrations);
  log(`[debug] upstream top-level defs : ${upDefs.size}`);
  log(`[debug] local    top-level defs : ${localDefs.size}`);
  log(`[debug] seed count              : ${seeds.size}`);
  log(`[debug] seeds                   : ${[...seeds].sort().join(", ")}`);
  for (const h of helpers) {
    log(`[debug] helper "${h.name}" body=${h.text.length}B refs=${[...referencedNames(h.text)].sort().join(", ")}`);
  }
}

// --- 5. splice -------------------------------------------------------------
const EOL = localMigrations.includes("\r\n") ? "\r\n" : "\n";
const toEol = (t) => t.split(/\r?\n/).join(EOL);

const arrEnd = "    }," + EOL + "];";
const arrIdx = localMigrations.indexOf(arrEnd);
if (arrIdx < 0) fail(`MIGRATIONS terminator not found (${JSON.stringify(arrEnd)})`);

const helperIdx = localMigrations.indexOf(HELPERS_ANCHOR);
if (helperIdx < 0) fail(`anchor "${HELPERS_ANCHOR}" not found`);

const helperBlock = toEol(
  [
    "/**",
    ` * Upstream helper closure for migrations v${localMax + 1}..v${upCeiling} — ported`,
    ` * verbatim from ${tag}.`,
    " *",
    " * Generated by tools/port-upstream-migrations.mjs. These live next to the",
    " * migrations that call them (rather than in a separate module) so this port",
    " * stays a single-file diff against upstream.",
    " */",
    ...helpers.map((h) => h.text.trimEnd()),
  ].join("\n"),
);

// migrations first (positions shift for the helper splice, so re-find it)
let patched =
  localMigrations.slice(0, arrIdx + ("    }," + EOL).length) +
  toEol(deltaText) +
  EOL +
  "];" +
  localMigrations.slice(arrIdx + arrEnd.length);

const helperIdx2 = patched.indexOf(HELPERS_ANCHOR);
patched = patched.slice(0, helperIdx2) + helperBlock + EOL + EOL + patched.slice(helperIdx2);

const nextStorage = localStorage.replace(FENCE_RE, `export const LATEST_SUPPORTED_VERSION = ${upCeiling};`);

// --- 6. report / write -----------------------------------------------------
log(`\nmigrations.ts : +${(patched.split(EOL).length - localMigrations.split(EOL).length)} lines`);
log(`storage-db.ts : LATEST_SUPPORTED_VERSION ${localCeiling} -> ${upCeiling}`);

if (!apply) {
  log("\ndry run — nothing written. Re-run with --apply to commit the change.");
  process.exit(0);
}

writeFileSync(localMigrationsPath, patched, "utf8");
writeFileSync(localStoragePath, nextStorage, "utf8");
log("\napplied. verify with:");
log("  bun run --cwd packages/plugin typecheck");
log("  bun test packages/plugin/src/features/magic-context/schema-version-fence.test.ts");
log("  bun run build");
