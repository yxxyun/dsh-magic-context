/**
 * DSH retrospective raw provider.
 *
 * `retrospective` reads OTHER sessions' raw history to spot friction the user
 * expressed (repeated calls, error bursts, re-asks). The core ships an
 * OpenCode-backed provider, but it hardcodes `harness = 'opencode'` in its
 * project listing, so the port needs its own: this one enumerates
 * `session_projects` rows for the DSH harness and reads each session's log
 * through the host's `sessionQuery` service (see `session-history.ts`).
 *
 * PRIVACY (the core's contract, and the reason this file is strict):
 *   - only GENUINE user text is emitted — magic-injected baselines and other
 *     synthetic parts are dropped, or the retrospective would report our own
 *     injected knowledge as "the user said this";
 *   - assistant text is never emitted (it can carry file contents from other
 *     sessions);
 *   - tool rows carry METADATA ONLY: `text` stays empty, `toolName` and
 *     `isError` are what the detectors need.
 *     Note: the core's OpenCode mapper fills `text` with the tool output even
 *     though its own comment forbids it. We follow the comment (and the
 *     documented Pi behaviour) — a DSH tool row never carries output text.
 */
import type { Database } from "@magic-context/core/shared/sqlite";
import type {
  RetrospectiveProjectSession,
  RetrospectiveRawMessage,
  RetrospectiveRawProvider,
  RetrospectiveSinceRead,
} from "@magic-context/core/features/magic-context/dreamer/retrospective-raw-provider";
import { log as coreLog } from "@magic-context/core/shared/logger";
import { rawMessageProviderFromView } from "./historian-wiring";
import { nativeDshSessionId, type HistoricalSessionReader } from "./session-history";

/** Parts that must never be reported as user speech (mirrors the core's rule). */
const SYNTHETIC_SOURCE_KINDS = new Set(["plugin", "compact-checkpoint", "system"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** User text of one raw message, or "" when it is synthetic/not genuine speech. */
export function genuineUserText(message: { role?: unknown; parts?: unknown }): string {
  if (message.role !== "user") return "";
  const parts = Array.isArray(message.parts) ? message.parts : [];
  const texts: string[] = [];
  for (const part of parts) {
    if (!isRecord(part) || part.type !== "text") continue;
    if (part.synthetic === true || part.ignored === true) continue;
    const source = isRecord(part.source) ? part.source : undefined;
    const kind = typeof source?.kind === "string" ? source.kind : undefined;
    if (kind !== undefined && SYNTHETIC_SOURCE_KINDS.has(kind)) continue;
    if (typeof part.text === "string" && part.text.trim().length > 0) texts.push(part.text.trim());
  }
  return texts.join("\n").trim();
}

/** One row per tool CALL, with the error flag looked for in the result text. */
export function toolRows(
  messages: readonly { parts?: unknown }[],
  ordinal: number,
  ts: number,
  sessionId: string,
): RetrospectiveRawMessage[] {
  const byCall = new Map<string, { toolName: string; output: string }>();
  for (const message of messages) {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    for (const part of parts) {
      if (!isRecord(part) || part.type !== "tool" || typeof part.tool !== "string") continue;
      const callId = typeof part.callID === "string" && part.callID.length > 0 ? part.callID : part.tool;
      const state = isRecord(part.state) ? part.state : {};
      const output = typeof state.output === "string" ? state.output : "";
      const existing = byCall.get(callId);
      // The call part and its result share a callID; keep one row and prefer the
      // richer (result) text so the error test sees the outcome.
      if (existing === undefined || (existing.output.length === 0 && output.length > 0)) {
        byCall.set(callId, { toolName: part.tool, output });
      }
    }
  }
  return [...byCall.values()].map((entry) => ({
    sessionId,
    ordinal,
    role: "tool" as const,
    text: "",
    toolName: entry.toolName,
    // Mirrors the core's own fallback: no status/error field reaches us, so the
    // output text decides.
    isError: /\b(error|failed|exception|traceback)\b/i.test(entry.output),
    ts,
  }));
}

/** Rows for one session's messages, already ordered oldest-first by the reader. */
function rowsForSession(
  sessionId: string,
  messages: readonly { parts?: unknown; createdAt?: unknown }[],
): RetrospectiveRawMessage[] {
  const rows: RetrospectiveRawMessage[] = [];
  for (const [index, message] of messages.entries()) {
    const ordinal = index + 1;
    const raw = message.createdAt;
    const ts = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    const text = genuineUserText(message);
    if (text.length > 0) {
      rows.push({ sessionId, ordinal, role: "user", text, ts });
    }
    rows.push(...toolRows([message], ordinal, ts, sessionId));
  }
  return rows;
}

/**
 * Cap a since-read and report the EXACT over-cap signal. The core clamps its
 * watermark on `truncated`, so inferring it from the returned length would
 * either skip pending work (false negative) or re-read forever (false positive).
 */
export function capSinceRows(
  rows: readonly RetrospectiveRawMessage[],
  capPerSession: number,
): RetrospectiveSinceRead {
  return { messages: rows.slice(0, capPerSession), truncated: rows.length > capPerSession };
}

export interface DshRetrospectiveProviderDeps {
  readonly db: Database;
  readonly readHistory: HistoricalSessionReader;
}

export function createDshRetrospectiveProvider(
  deps: DshRetrospectiveProviderDeps,
): RetrospectiveRawProvider {
  // One run reads each session at most once: the consumer calls
  // readUserMessagesSince per session and readUserMessagesBefore for the
  // boundary overlap, and every read replays the whole log.
  const cache = new Map<string, RetrospectiveRawMessage[]>();

  const rowsFor = async (canonicalSessionId: string): Promise<RetrospectiveRawMessage[]> => {
    const cached = cache.get(canonicalSessionId);
    if (cached !== undefined) return cached;
    const view = await deps.readHistory(nativeDshSessionId(canonicalSessionId));
    if (view === null) {
      cache.set(canonicalSessionId, []);
      return [];
    }
    const provider = rawMessageProviderFromView({ ...view, canonicalSessionId });
    const messages = provider.readMessages() as unknown as {
      parts?: unknown;
      createdAt?: unknown;
    }[];
    const rows = rowsForSession(canonicalSessionId, messages);
    cache.set(canonicalSessionId, rows);
    return rows;
  };

  return {
    listProjectSessions(projectIdentity: string): RetrospectiveProjectSession[] {
      try {
        // The DSH harness string is set by the port's bootstrap; child sessions
        // are excluded from project tracking, so these are roots only.
        const rows = deps.db
          .prepare(
            `SELECT session_id, updated_at FROM session_projects
             WHERE project_path = ? AND harness = 'dsh'
             ORDER BY updated_at ASC`,
          )
          .all(projectIdentity) as { session_id: string; updated_at: number | null }[];
        return rows.map((row) => ({
          sessionId: row.session_id,
          updatedAt: typeof row.updated_at === "number" ? row.updated_at : undefined,
        }));
      } catch (error) {
        coreLog(`[magic-context] retrospective session listing failed (degrading): ${String(error)}`);
        return [];
      }
    },

    async readUserMessagesSince(
      sessionId: string,
      sinceMs: number,
      capPerSession: number,
    ): Promise<RetrospectiveSinceRead> {
      const rows = (await rowsFor(sessionId)).filter((row) => row.ts > sinceMs);
      return capSinceRows(rows, capPerSession);
    },

    async readUserMessagesBefore(
      sessionId: string,
      beforeMs: number,
      count: number,
    ): Promise<RetrospectiveRawMessage[]> {
      const rows = (await rowsFor(sessionId)).filter(
        (row) => row.role === "user" && row.ts <= beforeMs,
      );
      return rows.slice(Math.max(0, rows.length - count));
    },

    dispose(): void {
      cache.clear();
    },
  };
}
