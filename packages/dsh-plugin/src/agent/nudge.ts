/**
 * agent/nudge — ctx_reduce Channel-1 / Channel-2 nudges (Pi parity).
 *
 * Pi appends `<system-reminder>` blocks in-turn (Channel 1) and escalates to a
 * synthetic-user ceiling interrupt (Channel 2). DSH follows its "inject, do not
 * rewrite" philosophy: the decision functions and reminder bodies are the
 * shared core's (`ctx-reduce-nudge`), and delivery rides `agent.inject(...)`
 * (visible on the next pre-step batch), deduplicated by a `mc-nudge:<kind>`
 * watermark on the live surface. State persistence (last_nudge_undropped /
 * channel1_nudge_state / channel2_nudge_state) uses the shared storage-meta
 * accessors, so a Pi↔DSH session pair shares cadence.
 *
 * v0.42.6 API note: the core replaced the absolute Channel-1 inputs
 * (`undroppedTokens` / `pressure` / `workingWindowTokens`) with a tail-hygiene
 * baseline plus per-turn deltas, and replaced `shouldTriggerChannel2` with
 * `evaluateChannel2`. The DSH port has no tail-hygiene pass of its own, so it
 * projects its tag aggregate onto that form: U = reclaimable tool output,
 * T = the whole live tail, deltas 0. Protected tags moved from a newest-N count
 * to an exact membership set (+ tag-number cutoff); the port converts its
 * configured count into that representation in `protectedWindow`.
 */
import type { Agent } from "@deepseek-ai/dsh-agent";
import {
  buildChannel1Reminder,
  buildChannel2Reminder,
  CHANNEL1_FLOOR_TOKENS,
  decideChannel1,
  evaluateChannel2,
} from "@magic-context/core/hooks/magic-context/ctx-reduce-nudge";
import {
  getActiveTagTokenAggregate,
  getOldestActiveUnprotectedToolTags,
} from "@magic-context/core/features/magic-context/storage-tags";
import { getTagsBySession } from "@magic-context/core/features/magic-context/storage";
import {
  getChannel1NudgeState,
  getChannel2NudgeState,
  getLastNudgeUndropped,
  setChannel1NudgeState,
  setChannel2NudgeState,
  setLastNudgeUndropped,
} from "@magic-context/core/features/magic-context/storage-meta-persisted";
import type { Database } from "@magic-context/core/shared/sqlite";
import type { TagEntry } from "@magic-context/core/features/magic-context/types";
import { isMagicSource, magicUserMessage, type MagicMessageSource, MAGIC_SOURCE_KIND } from "../compat/dsh-0.1/session";

/** Scan the session event log for the live context window + last input usage. */
export function scanSessionMetrics(agent: Agent): {
  lastInputTokens: number;
  contextWindow: number | undefined;
} {
  let lastInputTokens = 0;
  let contextWindow: number | undefined;
  const events = (agent.session as { events?: readonly unknown[] }).events ?? [];
  for (const event of events) {
    if (event === null || typeof event !== "object") continue;
    const e = event as { type?: unknown; data?: unknown };
    if (e.type === "request/context") {
      const cw = (e.data as { contextWindow?: unknown } | undefined)?.contextWindow;
      if (typeof cw === "number" && cw > 0) contextWindow = cw;
      continue;
    }
    if (e.type === "assistant/message") {
      const usage = (e.data as { usage?: unknown } | undefined)?.usage as
        | { inputTokens?: unknown }
        | undefined;
      if (usage !== undefined && typeof usage === "object") {
        const input = (usage as { inputTokens?: unknown }).inputTokens;
        if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
          lastInputTokens = input;
        }
      }
    }
  }
  return { lastInputTokens, contextWindow };
}

/**
 * Convert the legacy newest-N protected-tag count into the v0.42.6
 * token-window representation: an exact membership set plus a tag-number
 * cutoff. Tags with `tag_number < cutoff` are reclaimable; a null cutoff means
 * no threshold is applied (nothing is protected).
 */
function protectedWindow(
  tags: readonly TagEntry[],
  newestCount: number,
): { numbers: ReadonlySet<number>; cutoff: number | null } {
  if (newestCount <= 0) return { numbers: new Set<number>(), cutoff: null };
  const newest = tags
    .filter((t) => t.type === "tool" && t.status === "active")
    .sort((a, b) => b.tagNumber - a.tagNumber)
    .slice(0, newestCount);
  const oldestProtected = newest[newest.length - 1];
  return {
    numbers: new Set(newest.map((t) => t.tagNumber)),
    cutoff: oldestProtected === undefined ? null : oldestProtected.tagNumber,
  };
}

/** How many tool outputs are reclaimable (active and outside the window). */
function reclaimableOutputCount(
  tags: readonly TagEntry[],
  protectedNumbers: ReadonlySet<number>,
): number {
  return tags.filter(
    (t) => t.type === "tool" && t.status === "active" && !protectedNumbers.has(t.tagNumber),
  ).length;
}

function injectNudge(
  agent: Agent,
  sessionId: string,
  kind: "channel1" | "channel2",
  text: string,
): void {
  // Dedup: only inject when the surface has no live mc-nudge:<kind> node.
  const marker = `mc-nudge:${kind}`;
  const events = (agent.session as { events?: readonly unknown[] }).events ?? [];
  if (
    events.some((event) => {
      if (event === null || typeof event !== "object") return false;
      const e = event as { data?: { source?: { plugin?: unknown; messageId?: unknown } } };
      const source = e.data?.source;
      return isMagicSource(source) && source?.messageId === marker;
    })
  ) {
    return;
  }
  const source: MagicMessageSource = {
    kind: MAGIC_SOURCE_KIND,
    messageId: marker,
  };
  const message = magicUserMessage(text, source, []);
  (agent as unknown as { inject?: (m: unknown) => void }).inject?.(message);
}

export interface NudgeOptions {
  /** execute-threshold percentage (default 65). */
  threshold?: number;
  /** Protected-tag tail (default 20). */
  protectedTags?: number;
  /** Override context window (default: scan the session events). */
  contextWindow?: number;
  /** Logger sink (optional). */
  log?: (message: string) => void;
}

/**
 * Evaluate both nudge channels for a magic session. Runs inside the pre-step
 * after plan application; never throws (fail-open).
 */
export function maybeNudgeChannels(
  db: Database,
  sessionId: string,
  agent: Agent,
  opts: NudgeOptions = {},
): void {
  try {
    const threshold = Math.max(0, opts.threshold ?? 65);
    const protectedTags = Math.max(0, opts.protectedTags ?? 20);
    const { lastInputTokens, contextWindow: scanWindow } = scanSessionMetrics(agent);
    const contextWindow = opts.contextWindow ?? scanWindow ?? 1_000_000;
    if (typeof contextWindow !== "number" || contextWindow <= 0) return;

    const tags = getTagsBySession(db, sessionId);
    const window = protectedWindow(tags, protectedTags);
    const agg = getActiveTagTokenAggregate(db, sessionId, window.cutoff);
    const reclaimable = agg.toolOutput ?? 0;

    // Project the tag aggregate onto the v0.42.6 tail-hygiene baseline form.
    const baselineU = reclaimable;
    const baselineT = Math.max(baselineU, agg.conversation + agg.toolCall + reclaimable);

    // ── Channel 1: in-turn gentle/firm/urgent reminder ──
    if (reclaimable >= CHANNEL1_FLOOR_TOKENS) {
      const nudgeState = getChannel1NudgeState(db, sessionId);
      const decision = decideChannel1({
        baselineU,
        baselineT,
        turnDeltaU: 0,
        turnDeltaT: 0,
        lastNudgeUndropped: getLastNudgeUndropped(db, sessionId),
        lastNudgeLevel: nudgeState.level,
        lastFireOrdinal: nudgeState.ordinal,
        hasRecentReduce: false,
      });
      setLastNudgeUndropped(db, sessionId, decision.nextLastNudge);
      // Cadence level and dampening ordinal travel together in one persisted state.
      setChannel1NudgeState(db, sessionId, {
        ...nudgeState,
        level: decision.nextLastNudgeLevel,
        postReduceGracePending: decision.clearPostReduceGrace
          ? undefined
          : nudgeState.postReduceGracePending,
        postReduceGraceBaselineU: decision.clearPostReduceGrace
          ? undefined
          : nudgeState.postReduceGraceBaselineU,
        postReduceGracePreLevel: decision.clearPostReduceGrace
          ? undefined
          : nudgeState.postReduceGracePreLevel,
      });
      if (decision.fire) {
        const hint = getOldestActiveUnprotectedToolTags(db, sessionId, window.numbers, 4);
        const reminder = buildChannel1Reminder(
          decision.level,
          decision.undroppedTokens,
          reclaimableOutputCount(tags, window.numbers),
          hint,
          decision.sticky,
        );
        injectNudge(agent, sessionId, "channel1", reminder);
        opts.log?.(`[magic-context] channel1 nudge fired: level=${decision.level} reclaimable~${Math.round(reclaimable / 1000)}k`);
      }
    }

    // ── Channel 2: ceiling escalation (one-shot per session) ──
    const evaluation = evaluateChannel2({
      baselineU,
      baselineT,
      turnDeltaU: 0,
      turnDeltaT: 0,
      evaluable: true,
      generationInvalidated: false,
    });
    void lastInputTokens;
    if (evaluation.shouldTrigger) {
      const state = getChannel2NudgeState(db, sessionId);
      if (state === "") {
        const hint = getOldestActiveUnprotectedToolTags(db, sessionId, window.numbers, 4);
        const reminder = buildChannel2Reminder(
          evaluation.reclaimableTokens,
          reclaimableOutputCount(tags, window.numbers),
          hint,
        );
        // 一次性发送语义：注入前占位的状态机（pending → delivered）。
        setChannel2NudgeState(db, sessionId, "delivered");
        injectNudge(agent, sessionId, "channel2", reminder);
        opts.log?.(`[magic-context] channel2 nudge delivered: reclaimable~${Math.round(evaluation.reclaimableTokens / 1000)}k`);
      }
    }
  } catch {
    // Nudges must never break the pre-step chain (fail-open).
  }
}
