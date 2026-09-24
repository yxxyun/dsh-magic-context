#!/usr/bin/env node
// Live-artifact verification for magic-context-on-DSH.
//
// Every check here encodes a real regression that shipped and was fixed, so this
// file is the machine-checkable form of "did we break it again":
//
//   log-integrity              a session log must decode frame-by-frame with no
//                              torn tail and a readable header (a wrongly
//                              appended event once made logs unopenable).
//   surface-identity-uniqueness  no two append-origin nodes may share a Chat
//                              identity key. The client keys `input-message` on
//                              String(data.id); a duplicate makes the whole
//                              conversation view throw and render blank.
//   injection-watermark-uniqueness  a message-scoped Magic watermark (`mc-kb:`)
//                              must own exactly one LIVE (folded) node. Delivering
//                              the same batch through two channels produced two
//                              nodes with different ids and one watermark.
//   tag-prefix-integrity       the `§N§ ` prefix persisted into a message must
//                              equal that message's own tag number, and the
//                              message must own exactly one tag row. Keying the
//                              preview on a bare message id instead of the
//                              content id `:p0` allocated a fresh number and
//                              wrote the WRONG prefix into the surface.
//   tag-number-integrity       tag numbers must be unique (a duplicate means the
//                              allocator handed out a taken number).
//
// Usage:
//   node e2e/verify-live.mjs [--home <DSH_HOME>] [--session <id|dir>] [--log <file>]
//                            [--db <context.db>] [--recent <K>] [--since <ISO>] [--json]
//
// `--since` is the boundary that turns tag-prefix-integrity from scar-tolerant
// into strict: pass the moment the FIXED plugin was actually loaded (its deploy
// mtime / the restart that followed), not the commit time — a message written
// between commit and restart still carries a pre-fix scar. Without `--since`,
// pre-fix bare-id rows are reported as information and the check only asserts
// that a persisted `§N§ ` prefix matches one of its own tag rows.
//
// Exit: 0 = all checks passed, 1 = a check failed, 2 = the harness could not run.
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { foldSurface, isAppend, prefixOf, readSessionLog } from "./lib/session-log.mjs";

const EXIT_PASS = 0;
const EXIT_FAIL = 1;
const EXIT_HARNESS = 2;

function parseArgs(argv) {
  const out = { flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "json") { out.flags.json = true; continue; }
    out[key] = argv[i + 1];
    i += 1;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const HOME = args.home ?? process.env.DSH_HOME ?? join(homedir(), ".dsh");
const DB =
  args.db ??
  (process.env.MAGIC_CONTEXT_TEST_DATA_DIR
    ? join(process.env.MAGIC_CONTEXT_TEST_DATA_DIR, "cortexkit", "magic-context", "context.db")
    : join(homedir(), ".local", "share", "cortexkit", "magic-context", "context.db"));
const RECENT = Number(args.recent ?? 20);
const SINCE = args.since === undefined ? null : Date.parse(args.since);
if (args.since !== undefined && Number.isNaN(SINCE)) harnessError(`--since "${args.since}" is not a parseable timestamp`);

function harnessError(message) {
  console.error(`verify-live: ${message}`);
  process.exit(EXIT_HARNESS);
}

/** Newest session directory under <home>/sessions/<workspace-slug>/. */
function resolveSessionDir() {
  if (args.session) {
    if (existsSync(args.session) && statSync(args.session).isDirectory()) return args.session;
    for (const slug of readdirSync(join(HOME, "sessions"))) {
      const candidate = join(HOME, "sessions", slug, `session-${args.session}`);
      if (existsSync(candidate)) return candidate;
      const bare = join(HOME, "sessions", slug, args.session);
      if (existsSync(bare)) return bare;
    }
    harnessError(`session "${args.session}" not found under ${join(HOME, "sessions")}`);
  }
  const root = join(HOME, "sessions");
  if (!existsSync(root)) harnessError(`no sessions directory at ${root}`);
  let newest = null;
  for (const slug of readdirSync(root)) {
    for (const dir of readdirSync(join(root, slug))) {
      const full = join(root, slug, dir);
      if (!statSync(full).isDirectory()) continue;
      const mtime = statSync(full).mtimeMs;
      if (newest === null || mtime > newest.mtime) newest = { dir: full, mtime };
    }
  }
  if (newest === null) harnessError(`no session directories under ${root}`);
  return newest.dir;
}

const sessionDir = resolveSessionDir();
const logFile =
  args.log ??
  ["session.v4.jsonl.zstd", "session.jsonl.zstd"]
    .map((name) => join(sessionDir, name))
    .find((file) => existsSync(file));
if (logFile === undefined || !existsSync(logFile)) harnessError(`no session log at ${logFile ?? sessionDir}`);

const log = readSessionLog(logFile);
const header = log.header;
const sessionId = header?.id ?? header?.sessionId ?? sessionDir.split(/[\\/]/).pop();

/** Magic's DB keys are `dsh:<home-hash>:session-<uuid>`; match on the uuid suffix. */
function findSessionKey(db) {
  const rows = db
    .prepare("SELECT DISTINCT session_id FROM tags WHERE harness='dsh'")
    .all()
    .map((row) => row.session_id);
  const uuid = String(sessionId).replace(/^session-/, "");
  const hit = rows.find((key) => key.endsWith(uuid));
  return hit ?? null;
}

const checks = [];
function check(name, run) {
  try {
    checks.push({ name, ...run() });
  } catch (error) {
    checks.push({ name, status: "fail", detail: [`threw: ${error instanceof Error ? error.message : String(error)}`] });
  }
}

// ---------------------------------------------------------------- log-integrity
check("log-integrity", () => {
  const detail = [
    `file=${logFile.split(/[\\/]/).slice(-2).join("/")}`,
    `bytes=${log.bytes} frames=${log.frames} events=${log.events.length}`,
    `header=${header === undefined ? "MISSING" : "present"}`,
    `torn-tail=${log.torn === 1 ? "YES" : "no"}`,
  ];
  const ok = log.torn === 0 && header !== undefined && log.events.length > 0;
  return { status: ok ? "pass" : "fail", detail };
});

// ------------------------------------------------- surface-identity-uniqueness
check("surface-identity-uniqueness", () => {
  // Semantics: the client's `input-message` matcher accepts APPEND-origin
  // user/message events only (replacements render through the catch-all, keyed by
  // seq), and keys them on String(data.id). So duplicates must be counted over
  // append-origin events — folding would HIDE them, because a replacement appears
  // in the log after the duplicate and would shadow one of the two nodes.
  const keys = [];
  for (const event of log.events) {
    if (event.type === "user/message") {
      if (!isAppend(event)) continue;
      if (event.data?.source?.kind === "compact-checkpoint") continue; // host checkpoint, not a turn
      keys.push({ kind: "input-message", id: String(event.data.id), seq: event.seq });
    } else if (event.type === "tool/call") {
      keys.push({ kind: "tool", id: String(event.data.callId), seq: event.seq });
    } else if (event.type === "command/run" && event.data?.commandId !== undefined) {
      keys.push({ kind: "command", id: String(event.data.commandId), seq: event.seq });
    } else if (event.type === "step/start") {
      keys.push({ kind: "step", id: `${event.data.turn}:${event.data.step}`, seq: event.seq });
    } else if (event.type === "turn/start") {
      keys.push({ kind: "turn", id: String(event.data.turn), seq: event.seq });
    }
  }
  const byKey = new Map();
  for (const entry of keys) {
    const key = `${entry.kind}\u0000${entry.id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(entry.seq);
  }
  const collisions = [...byKey].filter(([, seqs]) => seqs.length > 1);
  const detail = [`identity keys=${keys.length}`, `colliding=${collisions.length}`];
  for (const [key, seqs] of collisions.slice(0, 8)) {
    const [kind, id] = key.split("\u0000");
    detail.push(`  ${kind} "${id}" at seqs ${seqs.join(", ")}`);
  }
  return { status: collisions.length === 0 ? "pass" : "fail", detail };
});

// -------------------------------------------- injection-watermark-uniqueness
check("injection-watermark-uniqueness", () => {
  const nodes = foldSurface(log.events);
  const bySeq = new Map(log.events.map((event) => [event.seq, event]));
  const byWatermark = new Map();
  for (const seq of nodes) {
    const event = bySeq.get(seq);
    const watermark = event?.data?.source?.messageId;
    if (typeof watermark !== "string" || watermark.length === 0) continue;
    if (!byWatermark.has(watermark)) byWatermark.set(watermark, []);
    byWatermark.get(watermark).push({ seq, id: event.data?.id });
  }
  // `mc-kb:` is message-scoped: m0 and m1 each own exactly one live node.
  // `mc-op:` is plan-scoped: one plan legitimately applies several ops, each with
  // its own id, so multiple nodes are fine — but a REPEATED id is not.
  const kb = [...byWatermark].filter(([watermark]) => watermark.startsWith("mc-kb:"));
  const kbDupes = kb.filter(([, list]) => list.length > 1);
  const opDupes = [...byWatermark]
    .filter(([watermark]) => !watermark.startsWith("mc-kb:"))
    .filter(([, list]) => new Set(list.map((node) => node.id)).size !== list.length);
  const detail = [
    `live surface nodes=${nodes.length}`,
    `mc-kb watermarks=${kb.length} owning >1 node=${kbDupes.length}`,
    `plan-scoped watermarks with a repeated id=${opDupes.length}`,
  ];
  for (const [watermark, list] of kbDupes.slice(0, 6)) {
    detail.push(`  ${watermark}`);
    for (const node of list) detail.push(`      seq ${node.seq} id ${node.id}`);
  }
  return { status: kbDupes.length === 0 && opDupes.length === 0 ? "pass" : "fail", detail };
});

// ---------------------------------------------------- tag-prefix-integrity
check("tag-prefix-integrity", () => {
  if (!existsSync(DB)) return { status: "skip", detail: [`no Magic DB at ${DB}`] };
  const db = new DatabaseSync(DB, { readOnly: true });
  try {
    const sessionKey = findSessionKey(db);
    if (sessionKey === null) return { status: "skip", detail: [`no harness='dsh' tags for session ${sessionId}`] };
    const rows = db.prepare("SELECT tag_number, message_id, type FROM tags WHERE session_id=?").all(sessionKey);
    const rowsByMessage = new Map();
    for (const row of rows) {
      if (!rowsByMessage.has(row.message_id)) rowsByMessage.set(row.message_id, []);
      rowsByMessage.get(row.message_id).push(row.tag_number);
    }
    const human = log.events.filter(
      (event) => event.type === "user/message" && isAppend(event) && event.data?.source?.kind === "user",
    );
    const recent = human.slice(-RECENT);
    const problems = [];
    const anomalies = [];
    const scars = [];
    let checked = 0;
    let untagged = 0;
    for (const [index, event] of recent.entries()) {
      const prefix = prefixOf(event);
      if (prefix === null) { untagged += 1; continue; }
      const id = String(event.data.id);
      const contentRows = rowsByMessage.get(`${id}:p0`) ?? [];
      const bareRows = rowsByMessage.get(id) ?? [];
      // The newest turn may not be tagged yet: tagging lands on the next pre-step.
      if (contentRows.length === 0 && bareRows.length === 0 && index === recent.length - 1) { untagged += 1; continue; }
      checked += 1;
      // `event.time` is epoch milliseconds (not an ISO string).
      const at = typeof event.time === "number" ? event.time : event.time === undefined ? null : Date.parse(event.time);
      const atValid = at !== null && Number.isFinite(at);
      if (SINCE !== null && atValid && at >= SINCE) {
        // Strict: after the fix a message owns exactly one `:p0` row, numbered
        // like its persisted prefix, and no bare-id row at all.
        if (bareRows.length > 0) problems.push(`seq ${event.seq} id ${id}: ${bareRows.length} bare-id row(s) ${bareRows.join(", ")} written after --since`);
        if (contentRows.length !== 1) problems.push(`seq ${event.seq} id ${id}: ":p0" rows=${contentRows.length}`);
        else if (contentRows[0] !== prefix) problems.push(`seq ${event.seq} id ${id}: prefix §${prefix}§ but tag_number §${contentRows[0]}§`);
        continue;
      }
      // Scar-tolerant: the persisted prefix must name one of this message's OWN
      // rows. Pre-fix history violates this in several shapes (bare row + `:p0`
      // row; a prefix naming a number that now belongs to a different message),
      // so these are reported as anomalies — they are damage, not regressions.
      // Only `--since` turns them into failures.
      const own = [...contentRows, ...bareRows];
      if (own.length === 0) anomalies.push(`seq ${event.seq} id ${id}: prefix §${prefix}§ but no tag row for this message`);
      else if (!own.includes(prefix)) anomalies.push(`seq ${event.seq} id ${id}: prefix §${prefix}§ matches none of its own rows [${own.join(", ")}]`);
      if (bareRows.length > 0) {
        scars.push(`seq ${event.seq} id ${id}: prefix §${prefix}§, ":p0" §${contentRows.join(",") || "-"}§, bare §${bareRows.join(",")}§`);
      }
    }
    const bareMessageRows = rows.filter((row) => row.type === "message" && !String(row.message_id).includes(":p0"));
    const detail = [
      `session key=${sessionKey}`,
      `mode=${SINCE === null ? "scar-tolerant (no --since)" : `strict, since ${new Date(SINCE).toISOString()}`}`,
      `recent human messages=${recent.length} checked=${checked} untagged=${untagged}`,
      `failures=${problems.length}  pre-fix anomalies=${anomalies.length}  pre-fix scars=${scars.length}`,
      ...problems.slice(0, 8).map((line) => `  !! ${line}`),
      ...anomalies.slice(0, 6).map((line) => `  (anomaly) ${line}`),
      ...scars.slice(0, 4).map((line) => `  (info) ${line}`),
      `bare-id MESSAGE rows in this session, whole history (informational)=${bareMessageRows.length}`,
    ];
    const status = problems.length > 0 ? "fail" : anomalies.length > 0 ? "warn" : "pass";
    return { status, detail };
  } finally {
    db.close();
  }
});

// ---------------------------------------------------- tag-number-integrity
check("tag-number-integrity", () => {
  if (!existsSync(DB)) return { status: "skip", detail: [`no Magic DB at ${DB}`] };
  const db = new DatabaseSync(DB, { readOnly: true });
  try {
    const sessionKey = findSessionKey(db);
    if (sessionKey === null) return { status: "skip", detail: [`no harness='dsh' tags for session ${sessionId}`] };
    const numbers = db
      .prepare("SELECT tag_number FROM tags WHERE session_id=? ORDER BY tag_number")
      .all(sessionKey)
      .map((row) => row.tag_number);
    const duplicates = [];
    const seen = new Set();
    for (const number of numbers) {
      if (seen.has(number)) duplicates.push(number);
      seen.add(number);
    }
    let gaps = 0;
    for (const [index, number] of numbers.entries()) if (number !== index + 1) gaps += 1;
    const detail = [
      `rows=${numbers.length} range=§${numbers[0]}§..§${numbers[numbers.length - 1]}§`,
      `duplicate numbers=${duplicates.length}${duplicates.length ? ` (${duplicates.slice(0, 8).join(", ")})` : ""}`,
      `non-contiguous positions=${gaps} (informational: deleting a scar row leaves a gap)`,
    ];
    return { status: duplicates.length === 0 ? "pass" : "fail", detail };
  } finally {
    db.close();
  }
});

// ------------------------------------------------------------------- report
const failed = checks.filter((entry) => entry.status === "fail");
const skipped = checks.filter((entry) => entry.status === "skip");
const warned = checks.filter((entry) => entry.status === "warn");
if (args.flags.json) {
  console.log(JSON.stringify({ session: sessionId, log: logFile, db: DB, checks }, null, 2));
} else {
  console.log(`session ${sessionId}`);
  console.log(`log     ${logFile}`);
  console.log(`db      ${existsSync(DB) ? DB : `${DB}  (absent)`}\n`);
  for (const entry of checks) {
    const mark = { pass: "PASS", skip: "SKIP", warn: "WARN", fail: "FAIL" }[entry.status] ?? "FAIL";
    console.log(`[${mark}] ${entry.name}`);
    for (const line of entry.detail) console.log(`       ${line}`);
  }
  const summary = `${checks.length - failed.length - skipped.length - warned.length}/${checks.length} passed`;
  console.log(
    `\n${summary}${skipped.length ? `, ${skipped.length} skipped` : ""}${warned.length ? `, ${warned.length} warn` : ""}${failed.length ? `, ${failed.length} FAILED` : ""}`,
  );
}
process.exit(failed.length === 0 ? EXIT_PASS : EXIT_FAIL);
