/**
 * compat/dsh-0.1/session — DSH session & surface seams.
 *
 * Encapsulates every `@deepseek-ai/dsh-session` and `@deepseek-ai/dsh-llm`
 * vocabulary the Magic adapter touches: message factories, append semantics,
 * the surface-replace CAS transaction, and replay helpers. DSH upgrades touch
 * ONLY this directory (PLAN §2).
 */
import {
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
  type ContentBlock,
  type Message,
  type UserMessage,
} from "@deepseek-ai/dsh-llm";
import {
  Session,
  SessionSeq,
  type SessionEvent,
  type SessionId,
} from "@deepseek-ai/dsh-session";
import {
  deriveEventMessage,
  foldSurface,
} from "@deepseek-ai/dsh-session/surface";

export {
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
  deriveEventMessage,
  foldSurface,
  Session,
};
export type { Message, SessionEvent, SessionId, UserMessage };

/** Text block shorthand. */
export function textBlock(text: string): { type: "text"; text: string } {
  return { type: "text", text };
}

/**
 * Producer-owned source kind for Magic-injected messages.
 *
 * DSH's V4 message format REFUSES `kind: "plugin"` outright — the retired V3
 * wrapper — and the runtime throws
 * `format v4 message requires a producer-owned source kind` on adoption, which
 * blocks the whole turn (messages cannot be sent at all). Third-party producers
 * must instead use their own identity in the form `plugin:<package>`, which is
 * exactly what the runtime's own V3→V4 upgrader synthesises via
 * `producerKind(plugin)` (`return \`plugin:${plugin}\``).
 *
 * The runtime validates only that `kind` is a non-empty string other than the
 * literal `"plugin"`; unknown kinds are explicitly preserved, so this value is
 * accepted and round-trips. `MessageSource` is a CLOSED union in the type stubs
 * and does not model custom kinds, so the cast below is the single documented
 * place where that boundary is crossed — same pattern as the harness identity.
 */
export const MAGIC_PLUGIN_PACKAGE = "dsh-magic-context";
export const MAGIC_SOURCE_KIND = `plugin:${MAGIC_PLUGIN_PACKAGE}`;

/** Source marker for Magic-injected knowledge messages (m0 baseline / m1 deltas). */
export interface MagicMessageSource {
  kind: typeof MAGIC_SOURCE_KIND;
  /** Baseline id for watermark de-duplication (PLAN §4.1). */
  messageId?: string;
  /** Render revision (materialization epoch) folded into the watermark. */
  revision?: string;
  /** Content digest (m0+m1) folded into the watermark. */
  digest?: string;
  /**
   * Legacy V3 identity. DSH's upgrader drops this field when lifting a V3
   * wrapper, so it is NOT required for admission — it is kept only so older
   * persisted rows that still carry it can be recognised.
   */
  plugin?: string;
}

/**
 * Build a Magic source marker. `plugin` is optional and only meaningful for
 * rows written before the V3→V4 rename.
 */
export function magicSource(
  extra: Omit<MagicMessageSource, "kind" | "plugin"> = {},
): MagicMessageSource {
  return { kind: MAGIC_SOURCE_KIND, ...extra };
}

/**
 * Is this source Magic's own? Tolerates both the current producer kind and the
 * legacy `{ kind: MAGIC_SOURCE_KIND }` shape so previously persisted
 * sessions keep being recognised.
 */
export function isMagicSource(source: unknown): boolean {
  if (source === null || typeof source !== "object") return false;
  const s = source as { kind?: unknown; plugin?: unknown };
  if (s.kind === MAGIC_SOURCE_KIND) return true;
  return s.kind === "plugin" && s.plugin === "magic-context";
}

/** Create a Magic-owned user message (knowledge injection / checkpoints). */
export function magicUserMessage(
  content: string,
  source: MagicMessageSource,
  extraBlocks: readonly ContentBlock[] = [],
): UserMessage {
  return createUserMessage({
    content: [textBlock(content), ...extraBlocks],
    // MessageSource is a closed union that does not model `plugin:<pkg>`;
    // the runtime accepts it (see MAGIC_SOURCE_KIND). Crossed once, here.
    source: source as never,
  });
}

/** Append a user-role surface message and return its seq. */
export function appendMessage(
  session: Session,
  message: UserMessage,
): number {
  return session.append("user/message", message, { surfaceOp: "append" }).seq;
}

/**
 * Surface-replace transaction (the CAS primitive): replace `[start..end]` with
 * one checkpoint message; `sourceEventSeqs` MUST cover every shadowed node.
 * Returns the new surface generation.
 *
 * The runtime's replace op takes `{ startSeq, endSeq }` (branded `SessionSeq`),
 * NOT `{ start, end }`. Passing the old field names meant the runtime read both
 * as `undefined`, so every surface replace silently failed to apply.
 */
export function replaceSurfaceRange(
  session: Session,
  start: number,
  end: number,
  message: UserMessage,
  sourceEventSeqs: readonly number[],
): number {
  const event = session.append("user/message", message, {
    surfaceOp: { op: "replace", startSeq: SessionSeq(start), endSeq: SessionSeq(end) },
    sourceEventSeqs: sourceEventSeqs.map((seq) => SessionSeq(seq)),
  });
  return event.seq;
}

/** Current surface nodes (model-visible order). */
export function surfaceNodes(session: Session): readonly number[] {
  return session.surface.nodes;
}

/** Current surface generation (CAS guard). */
export function surfaceGeneration(session: Session): number {
  return session.surface.replaceGeneration;
}

/**
 * Read a session's full event log.
 *
 * The DSH RUNTIME exposes events as `session.snapshotEvents()` — a METHOD. The
 * type stubs this adapter compiles against (0.1.0-rc.6) instead declare a plain
 * `session.events` property, which does not exist at runtime. Reading that
 * property yields `undefined`, and `for (const e of undefined)` throws
 * `TypeError: events is not iterable`.
 *
 * That throw was not benign: it fired inside the context plane's fail-open
 * try/catch on the FIRST pre-step of every session, so `reconcileSessionOutbox`
 * aborted the whole plane — no assistant/tool tagging, no history indexing, no
 * transform decisions — and the catch logged through `ctx.logger.info`, a sink
 * DSH never persists. The result looked perfectly healthy from the outside
 * while only the separate pre-step `payload.messages` preview (user messages
 * only) ever wrote tags.
 *
 * Prefer the runtime method, fall back to the property (tests, and any runtime
 * that does expose it), and never throw — an unreadable log must degrade to
 * "nothing to tag", not to "the plane is dead".
 *
 * Every degradation is reported through {@link setSessionEventsFailureReporter}
 * so the caller-side fail-open stays non-fatal WITHOUT staying invisible.
 */
export function sessionEvents(session: unknown): readonly SessionEvent[] {
  const view = session as unknown as {
    snapshotEvents?: () => unknown;
    events?: unknown;
  } | null | undefined;
  if (view === null || view === undefined) {
    reportSessionEventsFailure("session view is null/undefined");
    return [];
  }
  if (typeof view.snapshotEvents === "function") {
    const events = view.snapshotEvents();
    if (Array.isArray(events)) return events as readonly SessionEvent[];
    reportSessionEventsFailure(
      `snapshotEvents() returned ${typeof events}, not an array — falling back to the events property`,
    );
  }
  // NOTE: a MISSING snapshotEvents() is deliberately NOT reported. This accessor
  // is also called with the port's own transcript view — the `{events, surface,
  // header}` literals built in context-plane.ts / historian-wiring.ts — and with
  // test fakes. Those carry a perfectly good `events` array and no host methods,
  // so reporting them produced a per-step false alarm that read like a host API
  // breakage. Absence matters only when there is no `events` array either: that is
  // the #403 regression, reported below.
  if (Array.isArray(view.events)) return view.events as readonly SessionEvent[];
  reportSessionEventsFailure("session exposes neither snapshotEvents() nor an events array");
  return [];
}

/**
 * Report an unreadable session log to the operator.
 *
 * Degrading to `[]` is deliberate (an unreadable log must not kill the plane),
 * but doing it SILENTLY is what let the `session.events` regression run
 * undiagnosed: every consumer saw "nothing to do" and no operator saw a reason.
 * The agent plane installs a reporter that mirrors into magic-context.log.
 */
let sessionEventsFailureReporter: ((message: string) => void) | undefined;

/** Install the sink for {@link sessionEvents} degradations (undefined clears it). */
export function setSessionEventsFailureReporter(
  reporter: ((message: string) => void) | undefined,
): void {
  sessionEventsFailureReporter = reporter;
}

function reportSessionEventsFailure(message: string): void {
  try {
    sessionEventsFailureReporter?.(message);
  } catch {
    // Reporting must never be the thing that breaks a read.
  }
}

/**
 * Read one event by its ABSOLUTE seq, tolerating an events array whose index is
 * not the seq.
 *
 * `snapshotEvents()` currently returns the whole log, so `events[seq]` holds and
 * the fast path always wins. But that alignment is an assumption about the host,
 * and when it broke the failure was silent in the worst possible way: the
 * duplicate-id guard read `undefined` for a node that WAS on the surface, so it
 * answered "not on surface" and let a duplicate through. Scan the array instead
 * of trusting the index, and report the miss so a future host change is visible.
 */
export function findEventBySeq(
  events: readonly SessionEvent[],
  seq: number,
  onMisaligned?: (detail: string) => void,
): SessionEvent | undefined {
  const direct = events[seq] as SessionEvent | undefined;
  if (direct !== undefined && (direct as { seq?: unknown }).seq === seq) return direct;
  const found = events.find((event) => (event as { seq?: unknown }).seq === seq);
  if (found !== undefined && onMisaligned !== undefined) {
    try {
      onMisaligned(
        `events[${seq}] does not hold seq ${seq} (array length ${events.length}); recovered by scanning`,
      );
    } catch {
      // Reporting must never break the read it reports on.
    }
  }
  return found;
}
