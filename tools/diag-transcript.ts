/**
 * diag-transcript — replay a REAL DSH session log through the fork's own
 * transcript pipeline, to find out why assistant/tool messages never get tagged.
 *
 * The DSH port produces only user-message tags (`tags` has 3 rows, all
 * role=user; message_history_index / source_contents / transform_decisions are
 * all empty), while OpenCode on the same DB is fully tagged. Rather than
 * guessing, this feeds the persisted session log into the exact production
 * functions and reports what each stage sees.
 *
 * Usage:
 *   bun run tools/diag-transcript.ts <session.jsonl> [--surface-with-op]
 */
import { readFileSync } from "node:fs";
import { readDshTranscript } from "../packages/dsh-plugin/src/agent/transcript.ts";

const path = process.argv[2];
const surfaceWithOp = process.argv.includes("--surface-with-op");
if (!path) {
  console.error("usage: diag-transcript.ts <session.jsonl> [--surface-with-op]");
  process.exit(2);
}

const lines = readFileSync(path, "utf8").split("\n").filter((l) => l.trim());
const parsed = lines.map((l) => {
  try {
    return JSON.parse(l) as Record<string, unknown>;
  } catch {
    return null;
  }
}).filter((o): o is Record<string, unknown> => o !== null);

const header = parsed.find((o) => o.type === "session") ?? {};
const events = parsed.filter((o) => o.type !== "session" && typeof o.seq === "number");

console.log(`log lines      : ${lines.length}`);
console.log(`events (seq'd) : ${events.length}`);
console.log(`surfaceOp'd    : ${events.filter((e) => e.surfaceOp !== undefined).length}`);

/** Surface node seqs, in log order, for events that were applied to the surface. */
const surfaceSeqs = events
  .filter((e) => e.surfaceOp !== undefined)
  .map((e) => e.seq as number);
console.log(`surface seqs   : ${surfaceSeqs.length}${surfaceWithOp ? "" : " (not used unless --surface-with-op)"}`);

function run(label: string, surface: unknown): void {
  const view = readDshTranscript({
    session: { events, surface, header } as never,
    canonicalSessionId: "diag",
  });
  const byRole: Record<string, number> = {};
  const partsByKind: Record<string, number> = {};
  let samplePart: unknown = null;
  for (const m of view.messages) {
    byRole[m.role] = (byRole[m.role] ?? 0) + 1;
    // classifyRecordingPart switches on `raw.type`, so THAT is the field that
    // decides whether a part is taggable at all — checking `.kind` here was a
    // bug in the first version of this diagnostic.
    for (const p of (m as { parts?: Array<{ type?: string }> }).parts ?? []) {
      const k = `${m.role}/${p.type ?? "(NO type field)"}`;
      partsByKind[k] = (partsByKind[k] ?? 0) + 1;
      if (samplePart === null && m.role === "assistant") samplePart = p;
    }
  }
  console.log(`\n=== ${label} ===`);
  console.log(`view.messages  : ${view.messages.length}`);
  console.log(`sourceWatermark: ${view.sourceWatermark}`);
  console.log(`surfaceNodes   : ${view.surfaceNodes?.length ?? "(none)"}`);
  console.log("by role        :", JSON.stringify(byRole));
  console.log("by part type   :", JSON.stringify(partsByKind));
  if (samplePart !== null) {
    console.log("sample assistant part:", JSON.stringify(samplePart).slice(0, 200));
  }
}

// 1. exactly what the plugin passes when agent.session.surface is populated
run("surface.nodes = surface-applied seqs", { nodes: surfaceSeqs, replaceGeneration: 0 });

// 2. what happens when surface is absent (nodes falls back to [])
run("surface absent (nodes -> [])", undefined);

// 3. what happens when surface.nodes is an empty array
run("surface.nodes = [] (empty)", { nodes: [], replaceGeneration: 0 });
