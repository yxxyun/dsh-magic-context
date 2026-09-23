import { describe, expect, it, spyOn } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Session, SessionId } from "@deepseek-ai/dsh-session";
import * as loggerModule from "@magic-context/core/shared/logger";
import {
  createAssistantMessage,
  createUserMessage,
} from "../compat/dsh-0.1/session";
import type { PreStepDecision } from "../compat/dsh-0.1/prestep";
import { createTestDb } from "../test-utils";
import type { Database } from "@magic-context/core/shared/sqlite";
import { getTagsBySession } from "@magic-context/core/features/magic-context/storage";
import {
  createContextPlaneState,
  runContextPlaneStep,
  type ContextPlaneDeps,
} from "./context-plane";
import { listOutboxBySession } from "./outbox";

function buildSession(): Session {
  const session = Session.create(SessionId("sess-plane"));
  session.append(
    "user/message",
    createUserMessage({ content: [{ type: "text", text: "hello" }], source: { kind: "user" } }),
    { surfaceOp: "append" },
  );
  session.append(
    "assistant/message",
    {
      turn: 1,
      step: 1,
      message: createAssistantMessage({
        content: [{ type: "text", text: "hi" }],
        provider: "deepseek",
        model: "deepseek-chat",
        source: { kind: "model" },
      }),
    },
    { surfaceOp: "append" },
  );
  return session;
}

async function cleanupDir(dir: string, db?: Database): Promise<void> {
  try {
    db?.close();
  } catch {
    // already closed
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

describe("context plane (pre-step wiring of transcript + coordinator)", () => {
  it("tags the first pass without rewriting the surface, and passes the step through", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    try {
      const db = await createTestDb(join(dir, "context.db"));
      const session = buildSession();
      const agent = {
        id: session.id,
        session,
      };
      const deps: ContextPlaneDeps = {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: dir, livenessPath: "" }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { protectedTags: 0 },
        log: () => {},
      };

      const state = createContextPlaneState();
      let downstream = 0;
      const decision: PreStepDecision = { reject: false, messages: [] };
      const result = await runContextPlaneStep(
        state,
        deps,
        { agent: agent as never },
        async () => {
          downstream += 1;
          return decision;
        },
      );
      expect(result).toBe(decision);
      expect(downstream).toBe(1);
      // The first pass TAGGED the messages. Assert the tag rows themselves, not
      // a surface side effect: this plane deliberately runs with
      // skipPrefixInjection, so tagging must NOT rewrite the surface (doing so
      // is what wedged real sessions).
      const tags = getTagsBySession(db, "dsh:a1b2c3d4:sess-plane");
      expect(tags.length).toBeGreaterThan(0);
      expect(session.surface.replaceGeneration).toBe(0);
      // With prefix injection suppressed this fixture needs no surface mutation
      // at all (no pending drops, no temporal gaps, no cleanup config), so the
      // saga must stay empty. Records only exist for surface ops.
      const records = listOutboxBySession(db, "dsh:a1b2c3d4:sess-plane");
      expect(records.length).toBe(0);
      db.close();
    } finally {
      await cleanupDir(dir);
    }
  });

  it("is fail-open: a broken host bootstrap still passes the step through", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    try {
      const session = buildSession();
      const deps: ContextPlaneDeps = {
        host: {
          ready: Promise.resolve({
            kind: "refused",
            reason: "schema-fence",
            detail: "newer schema",
          }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { enabled: true },
        log: () => {},
      };
      const state = createContextPlaneState();
      let downstream = 0;
      const result = await runContextPlaneStep(
        state,
        deps,
        { agent: { id: session.id, session } as never },
        async () => {
          downstream += 1;
          return { reject: false, messages: [] };
        },
      );
      expect(result).toEqual({ reject: false, messages: [] });
      expect(downstream).toBe(1);
      expect(session.surface.replaceGeneration).toBe(0);
    } finally {
      await cleanupDir(dir);
    }
  });

  it("does not derive plans when disabled", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    try {
      const db = await createTestDb(join(dir, "context.db"));
      const session = buildSession();
      const deps: ContextPlaneDeps = {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: dir, livenessPath: "" }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { enabled: false },
        log: () => {},
      };
      await runContextPlaneStep(
        createContextPlaneState(),
        deps,
        { agent: { id: session.id, session } as never },
        async () => ({ reject: false, messages: [] }),
      );
      expect(session.surface.replaceGeneration).toBe(0);
      db.close();
    } finally {
      await cleanupDir(dir);
    }
  });

  it("fires the historian pass when the context pressure crosses the threshold", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    try {
      const db = await createTestDb(join(dir, "context.db"));
      const session = buildSession();
      const fired: Array<{ sessionId: string; provider: boolean }> = [];
      const deps: ContextPlaneDeps = {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: dir, livenessPath: "" }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { enabled: false }, // no plan derivation — trigger only
        directory: dir,
        historian: {
          config: { enabled: true, executeThresholdPercentage: 65, triggerBudgetTokens: 1000 },
          readPressure: () => ({ projectedTokens: 90_000, contextWindow: 128_000 }), // 70% ≥ 63% floor
          fire: ({ sessionId, provider }) => {
            fired.push({ sessionId, provider: provider !== undefined });
          },
        },
        log: () => {},
      };
      await runContextPlaneStep(
        createContextPlaneState(),
        deps,
        { agent: { id: session.id, session } as never },
        async () => ({ reject: false, messages: [] }),
      );
      expect(fired).toHaveLength(1);
      expect(fired[0]?.sessionId).toBe("dsh:a1b2c3d4:sess-plane");
      expect(fired[0]?.provider).toBe(true);
      db.close();
    } finally {
      await cleanupDir(dir);
    }
  });

  it("does not fire the historian pass below the threshold", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    try {
      const db = await createTestDb(join(dir, "context.db"));
      const session = buildSession();
      let fired = 0;
      const deps: ContextPlaneDeps = {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: dir, livenessPath: "" }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { enabled: false },
        historian: {
          config: { enabled: true, executeThresholdPercentage: 65, triggerBudgetTokens: 1000 },
          readPressure: () => ({ projectedTokens: 30_000, contextWindow: 128_000 }), // 23% < floor
          fire: () => {
            fired += 1;
          },
        },
        log: () => {},
      };
      await runContextPlaneStep(
        createContextPlaneState(),
        deps,
        { agent: { id: session.id, session } as never },
        async () => ({ reject: false, messages: [] }),
      );
      expect(fired).toBe(0);
      db.close();
    } finally {
      await cleanupDir(dir);
    }
  });

  it("warns about an empty transcript only when the surface actually had nodes", async () => {
    // DSH appends the turn's user/message AFTER preStep runs, so a session's
    // FIRST pre-step sees session events but ZERO surface nodes. The health
    // guard used to call that "tagging is producing nothing" on every fresh
    // session — log spam that also masked the real failure it exists to catch.
    const dir = mkdtempSync(join(tmpdir(), "dsh-magic-plane-"));
    const spy = spyOn(loggerModule, "log").mockImplementation(() => {});
    const warnings = () =>
      spy.mock.calls.filter((call) => String(call[0]).includes("empty transcript"));
    try {
      const db = await createTestDb(join(dir, "context.db"));
      const depsFor = (): ContextPlaneDeps => ({
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: dir, livenessPath: "" }),
          canonicalKey: (id: string) => `dsh:a1b2c3d4:${id}`,
        },
        config: { protectedTags: 0 },
        log: () => {},
      });

      // (a) Fresh session: an event exists, but nothing is on the surface yet.
      const fresh = Session.create(SessionId("sess-fresh"));
      fresh.append("session/title", { title: "fresh" } as never);
      expect(fresh.surface.nodes.length).toBe(0);
      await runContextPlaneStep(
        createContextPlaneState(),
        depsFor(),
        { agent: { id: fresh.id, session: fresh } as never },
        async () => ({ reject: false, messages: [] }),
      );
      expect(warnings()).toHaveLength(0);

      // (b) True positive: the surface carries a node, yet the walk derives no
      // messages from it — exactly the silent failure the guard must surface.
      // `system/message` is surface-eligible but skipped by the transcript walk,
      // so it reproduces "surface has content, transcript came back empty".
      // (This also proves the spy really intercepts the guard's log sink, so
      // case (a) cannot pass vacuously.)
      const broken = Session.create(SessionId("sess-broken"));
      broken.append(
        "system/message",
        {
          turn: 1,
          step: 1,
          message: { role: "system", content: [{ type: "text", text: "boot" }] },
        } as never,
        { surfaceOp: "append" },
      );
      expect(broken.surface.nodes.length).toBeGreaterThan(0);
      await runContextPlaneStep(
        createContextPlaneState(),
        depsFor(),
        { agent: { id: broken.id, session: broken } as never },
        async () => ({ reject: false, messages: [] }),
      );
      expect(warnings()).toHaveLength(1);
      expect(String(warnings()[0]?.[0])).toContain("surfaceNodes=1");

      db.close();
    } finally {
      spy.mockRestore();
      await cleanupDir(dir);
    }
  });
});

