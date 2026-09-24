/**
 * Runtime self-check for the agent plane.
 *
 * WHY THIS EXISTS: every failure this port has hit was SILENT. `apply()` threw
 * into a swallowed sink while "agent plane ready" still printed; the log
 * accessor drifted (`session.events` vs `snapshotEvents()`) and the whole context
 * plane quietly no-opped; the ctx_* tools registered successfully yet were absent
 * from the catalog the model saw. A startup banner that says "ready" is not
 * evidence, so this module states what was actually OBSERVED, and says so loudly
 * when an observation fails.
 *
 * It runs per session (a check needs a session to check) on the first pre-step,
 * and on demand through `/ctx-selfcheck`.
 */
import type { Database } from "@magic-context/core/shared/sqlite";
import { getTagsBySession } from "@magic-context/core/features/magic-context/storage";

/** The model-visible tools this port registers. Verified against the catalog. */
export const MAGIC_TOOL_NAMES = [
  "ctx_search",
  "ctx_memory",
  "ctx_note",
  "ctx_expand",
  "ctx_reduce",
  "todowrite",
] as const;

/** The host tool runtime slice used for the visibility assertion. */
interface ToolRuntimeView {
  view?: (scope: unknown) => { visible?: Map<string, unknown> } | undefined;
  get?: (name: string, scope?: unknown) => unknown;
}

export interface SelfCheckInput {
  /** Host tool runtime accessor (production: `() => ctx.get("tools")`). */
  readonly readTools?: () => unknown;
  /** The DSH agent: carries `session` and (usually) `ctx` as the viewing scope. */
  readonly agent: unknown;
  readonly db: Database;
  readonly canonicalSessionId: string;
  /** Surface node count, so "no events" can be told apart from "no content yet". */
  readonly surfaceNodes: number;
}

export interface SelfCheckReport {
  /** Human-readable observed facts (goes to the log and to /ctx-selfcheck). */
  readonly lines: string[];
  /** Non-empty when the plane cannot be trusted. */
  readonly failures: string[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

/**
 * Which accessor serves this session's event log. The port compiles against
 * 0.1.0-rc.6 stubs that declare `events`, while the 0.1.7 runtime exposes
 * `snapshotEvents()` — reading the wrong one produced "events is not iterable"
 * and an entire dead context plane.
 */
export function logAccessorOf(session: unknown): {
  accessor: "snapshotEvents" | "events" | "none";
  count: number;
} {
  const record = asRecord(session);
  if (record === undefined) return { accessor: "none", count: 0 };
  if (typeof record.snapshotEvents === "function") {
    try {
      const value = (record.snapshotEvents as () => unknown)();
      return { accessor: "snapshotEvents", count: Array.isArray(value) ? value.length : 0 };
    } catch {
      return { accessor: "none", count: 0 };
    }
  }
  if (Array.isArray(record.events)) return { accessor: "events", count: record.events.length };
  return { accessor: "none", count: 0 };
}

/** Names of this port's tools that the given agent can actually see. */
export function toolVisibility(
  tools: unknown,
  agent: unknown,
): { missing: string[]; verifiable: boolean; scope: string } {
  const runtime = asRecord(tools) as ToolRuntimeView | undefined;
  const scopes: Array<[string, unknown]> = [["agent", agent]];
  const agentCtx = asRecord(agent)?.ctx;
  if (agentCtx !== undefined) scopes.push(["agent.ctx", agentCtx]);

  let verifiable = false;
  for (const [label, scope] of scopes) {
    for (const fn of ["view", "get"] as const) {
      if (typeof runtime?.[fn] !== "function") continue;
      try {
        if (fn === "view") {
          const visible = (runtime.view as (s: unknown) => { visible?: Map<string, unknown> })(scope)
            ?.visible;
          if (visible instanceof Map) {
            verifiable = true;
            return {
              missing: MAGIC_TOOL_NAMES.filter((name) => !visible.has(name)),
              verifiable,
              scope: label,
            };
          }
        } else {
          const absent = MAGIC_TOOL_NAMES.filter(
            (name) => (runtime.get as (n: string, s: unknown) => unknown)(name, scope) === undefined,
          );
          verifiable = true;
          return { missing: absent, verifiable, scope: label };
        }
      } catch {
        // Try the next shape rather than guessing which scope the runtime wants.
      }
    }
  }
  // No lookup API: report unverifiable rather than pretending success.
  return { missing: [], verifiable, scope: "unavailable" };
}

export function runSelfCheck(input: SelfCheckInput): SelfCheckReport {
  const lines: string[] = [];
  const failures: string[] = [];

  const { accessor, count } = logAccessorOf(asRecord(input.agent)?.session);
  lines.push(`log accessor: ${accessor} (${count} event(s), surfaceNodes=${input.surfaceNodes})`);
  if (accessor === "none") {
    failures.push(
      "the session exposes neither snapshotEvents() nor an events array — the context plane cannot read history",
    );
  } else if (count === 0 && input.surfaceNodes > 0) {
    failures.push(
      `the log reads as empty (${accessor}) while the surface has ${input.surfaceNodes} node(s)`,
    );
  }

  const visibility = toolVisibility(input.readTools?.(), input.agent);
  if (!visibility.verifiable) {
    lines.push(`tool visibility: NOT VERIFIABLE (no tools.view/get on this host)`);
  } else {
    lines.push(
      `tool visibility: ${MAGIC_TOOL_NAMES.length - visibility.missing.length}/${MAGIC_TOOL_NAMES.length} visible via ${visibility.scope}`,
    );
    if (visibility.missing.length > 0) {
      // The exact shape of the ctx_* disappearance: registration succeeded, the
      // catalog never carried them.
      failures.push(`tools absent from the catalog this agent sees: ${visibility.missing.join(", ")}`);
    }
  }

  try {
    const tags = getTagsBySession(input.db, input.canonicalSessionId).length;
    lines.push(`tags for this session: ${tags}`);
    if (tags === 0 && input.surfaceNodes > 0) {
      failures.push("no tags exist for a session that has surface content — tagging is producing nothing");
    }
  } catch (error) {
    failures.push(`tag lookup failed: ${String(error)}`);
  }

  return { lines, failures };
}

/** One-line log form; failures are stated as failures, never folded into "ready". */
export function formatSelfCheck(report: SelfCheckReport, sessionId: string): string {
  const head = `[magic-context] self-check ${report.failures.length === 0 ? "ok" : "FAILED"} for ${sessionId}`;
  const body = report.lines.map((line) => `\n  - ${line}`).join("");
  const problems = report.failures.map((line) => `\n  !! ${line}`).join("");
  return `${head}${body}${problems}`;
}
