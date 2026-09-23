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

/** Source marker for Magic-injected knowledge messages (m0 baseline / m1 deltas). */
export interface MagicMessageSource {
  kind: "plugin";
  plugin: "magic-context";
  /** Baseline id for watermark de-duplication (PLAN §4.1). */
  messageId?: string;
  /** Render revision (materialization epoch) folded into the watermark. */
  revision?: string;
  /** Content digest (m0+m1) folded into the watermark. */
  digest?: string;
}

/** Create a Magic-owned user message (knowledge injection / checkpoints). */
export function magicUserMessage(
  content: string,
  source: MagicMessageSource,
  extraBlocks: readonly ContentBlock[] = [],
): UserMessage {
  return createUserMessage({
    content: [textBlock(content), ...extraBlocks],
    source,
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
 */
export function replaceSurfaceRange(
  session: Session,
  start: number,
  end: number,
  message: UserMessage,
  sourceEventSeqs: readonly number[],
): number {
  const event = session.append("user/message", message, {
    surfaceOp: { op: "replace", start, end },
    sourceEventSeqs: [...sourceEventSeqs],
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
 */
export function sessionEvents(session: unknown): readonly SessionEvent[] {
  const view = session as unknown as {
    snapshotEvents?: () => unknown;
    events?: unknown;
  } | null | undefined;
  if (view === null || view === undefined) return [];
  if (typeof view.snapshotEvents === "function") {
    const events = view.snapshotEvents();
    if (Array.isArray(events)) return events as readonly SessionEvent[];
  }
  return Array.isArray(view.events) ? (view.events as readonly SessionEvent[]) : [];
}
