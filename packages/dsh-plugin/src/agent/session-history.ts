/**
 * Cold session history for the timer-driven dream tasks.
 *
 * Dream tasks run from a timer and hold only a canonical Magic session id, while
 * every existing port transcript helper needs a live `Agent`. The host answers
 * this with `sessionQuery.readSession(id)` — "the complete replay-validated raw
 * event log, without making the session live" (`@deepseek-ai/dsh-session-query`
 * README, DSH 0.1.7-rc.1). That is why the port's dream paths could not read
 * history at all before: `refresh-primers` fell back to closed-book and
 * `retrospective` was a clean no-op.
 *
 * The service is OPTIONAL on purpose. When it is missing, or the id is unknown,
 * these readers return null and the consumers keep their documented fallbacks
 * (closed-book / no-op) rather than failing a background task.
 */
import type { Context } from "@deepseek-ai/cordis";
import { parseDshSessionKey } from "dsh-magic-context-adapter";
import { log as coreLog } from "@magic-context/core/shared/logger";

/** The slice of a session this module needs — the shape `readDshTranscript` accepts. */
export interface HistoricalSessionView {
  readonly events: readonly unknown[];
  readonly surface?: unknown;
  readonly header?: unknown;
}

export type HistoricalSessionReader = (dshSessionId: string) => Promise<HistoricalSessionView | null>;

/** The service view; only `readSession` is used (declared types are not vendored). */
interface SessionQueryServiceView {
  readSession?: (sessionId: string) => unknown;
}

/**
 * Canonical keys are `dsh:<homeHash>:<dshSessionId>`; the session store is keyed
 * by the native id. Accepts either form so callers can pass whatever they hold.
 */
export function nativeDshSessionId(canonicalOrNative: string): string {
  return parseDshSessionKey(canonicalOrNative)?.dshSessionId ?? canonicalOrNative;
}

/**
 * Resolve the optional `sessionQuery` service into a defensive reader.
 *
 * Shape note: the DSH bundle's `readSession` resolves to an observation carrying
 * `events` (verified in the bundle and its README), while a live-shaped session
 * would expose `snapshotEvents()`. Both are accepted rather than guessing, and
 * anything else returns null.
 */
export function historicalSessionReader(ctx: Context): HistoricalSessionReader {
  return async (dshSessionId: string) => {
    let service: SessionQueryServiceView | undefined;
    try {
      service = ctx.get("sessionQuery") as SessionQueryServiceView | undefined;
    } catch {
      service = undefined;
    }
    if (typeof service?.readSession !== "function") return null;
    try {
      const result = (await service.readSession(dshSessionId)) as
        | {
            events?: unknown;
            snapshotEvents?: () => unknown;
            surface?: unknown;
            header?: unknown;
          }
        | undefined;
      const events =
        typeof result?.snapshotEvents === "function" ? result.snapshotEvents() : result?.events;
      if (!Array.isArray(events)) return null;
      return { events, surface: result?.surface, header: result?.header };
    } catch (error) {
      // Unknown id / unreadable store are expected: the consumers' fallbacks are
      // the contract. Log it so a broken service is not mistaken for a miss.
      coreLog(
        `[magic-context] session-query read failed for ${dshSessionId} (degrading): ${String(error)}`,
      );
      return null;
    }
  };
}
