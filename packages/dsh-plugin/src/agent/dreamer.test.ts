/**
 * Phase 4 slice P1 — dreamer wiring tests.
 *
 * Covers: project discovery (session_projects dedupe + harness filter), the
 * DreamTimerClient-shaped facade (stub LLM: create/prompt/messages/delete,
 * model override, abort, tool-agent explicit failure), the /ctx-dream seam
 * shape (tasks/executor/runnable/scheduleSummary; executor no-LLM path with
 * telemetry), and the schedule-timer registration (injectable interval
 * factory; tick runs the core scheduler pass against the test DB).
 *
 * No network calls: the LLM is a stub stream, the timer factory is a capture.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Context } from "@deepseek-ai/cordis";
import type { GenerateOptions, LlmRuntime, StreamChunk } from "@deepseek-ai/dsh-llm";
import type { Database } from "@magic-context/core/shared/sqlite";
import { getDreamRuns } from "@magic-context/core/features/magic-context/dreamer/storage-dream-runs";
import {
  getTaskScheduleStatesForProject,
} from "@magic-context/core/features/magic-context/dreamer/storage-task-schedule";
import { CANONICAL_DREAM_TASKS } from "@magic-context/core/features/magic-context/dreamer/task-registry";
import { extractLatestAssistantText } from "@magic-context/core/shared/assistant-message-extractor";
import { createTestDb, createTestStorageDir } from "../test-utils";
import {
  __test,
  createDreamParentRegistry,
  createDshDreamClient,
  DEFAULT_DREAM_TICK_MS,
  discoverDreamProjects,
  dshDreamSeams,
  registerDshDreamer,
} from "./dreamer";

const PROJECT_A = "git:/tmp/dsh-proj-a";
const PROJECT_B = "dir:/tmp/dsh-proj-b";

async function cleanupDir(dir: string): Promise<void> {
  // Windows WAL: the DB handle's close is not immediately reflected in file
  // locks; retry like the other dsh-plugin suites do.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function openDb(): Promise<{ db: Database; cleanup: () => Promise<void> }> {
  const dir = createTestStorageDir();
  const db = await createTestDb(join(dir, "context.db"));
  return { db, cleanup: () => cleanupDir(dir) };
}

function insertSessionProject(
  db: Database,
  sessionId: string,
  harness: string,
  projectPath: string,
): void {
  db.prepare(
    "INSERT INTO session_projects (session_id, harness, project_path, updated_at) VALUES (?, ?, ?, ?)",
  ).run(sessionId, harness, projectPath, Date.now());
}

/** Stub LLM runtime: a single-turn text stream, with optional terminal
 *  finish and per-call options capture. */
function stubLlm(
  opts: { text?: string; finish?: StreamChunk["reason"]; calls?: GenerateOptions[] } = {},
): LlmRuntime {
  const text = opts.text ?? "stub dreamer answer";
  const calls = opts.calls ?? [];
  async function* stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    calls.push(options);
    if (opts.finish) {
      yield { type: "finish", reason: opts.finish };
      return;
    }
    yield { type: "text-delta", index: 0, text };
    yield { type: "finish", reason: { kind: "stop" } };
  }
  return { stream } as unknown as LlmRuntime;
}

interface FakeCtx {
  ctx: Context;
  /** Disposers returned by the stubbed ctx.effect (fiber disposal simulation). */
  disposers: Array<() => void>;
}

function makeFakeCtx(
  opts: {
    llm?: LlmRuntime;
    config?: unknown;
    agentDefaultModel?: unknown;
    subagents?: unknown;
  } = {},
): FakeCtx {
  const disposers: Array<() => void> = [];
  const ctx = {
    get: (name: string) => {
      if (name === "llm") return opts.llm;
      if (name === "agentDefaultModel") return opts.agentDefaultModel;
      if (name === "subagents") return opts.subagents;
      return undefined;
    },
    effect: (execute: () => () => void) => {
      disposers.push(execute());
      return () => {};
    },
    config: opts.config,
  };
  return { ctx: ctx as unknown as Context, disposers };
}

/** Fake subagents service capturing spawn requests. */
function stubSubagents(): {
  service: unknown;
  starts: Array<{ provider: string; request: Record<string, unknown> }>;
} {
  const starts: Array<{ provider: string; request: Record<string, unknown> }> = [];
  const service = {
    start: async (provider: string, request: Record<string, unknown>) => {
      starts.push({ provider, request });
      return {
        id: `child-${starts.length}`,
        result: Promise.resolve({
          stopReason: "stop",
          output: [{ type: "text", text: "worker mapped the sources" }],
        }),
        dispose: () => {},
      };
    },
  };
  return { service, starts };
}

interface CapturedInterval {
  fn: () => void;
  ms: number;
  disposed: boolean;
}

/** Replace the interval factory with a capture (fake timers). */
function captureIntervals(): { set: CapturedInterval[] } {
  const set: CapturedInterval[] = [];
  __test.setIntervalFactory((fn, ms) => {
    const record: CapturedInterval = { fn, ms, disposed: false };
    set.push(record);
    return () => {
      record.disposed = true;
    };
  });
  return { set };
}

/** Let host.ready continuation + initial tick passes settle. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 25));

afterEach(() => {
  __test.reset();
});

describe("discoverDreamProjects", () => {
  it("returns deduped dsh-harness project identities in stable order", async () => {
    const { db, cleanup } = await openDb();
    try {
      insertSessionProject(db, "s1", "dsh", PROJECT_A);
      insertSessionProject(db, "s2", "dsh", PROJECT_B);
      insertSessionProject(db, "s3", "dsh", PROJECT_A); // duplicate identity
      insertSessionProject(db, "s4", "opencode", "git:/tmp/oc-proj");
      insertSessionProject(db, "s5", "pi", "git:/tmp/pi-proj");
      // ORDER BY project_path: "dir:…" sorts before "git:…".
      expect(discoverDreamProjects(db)).toEqual([PROJECT_B, PROJECT_A]);
    } finally {
      db.close();
      await cleanup();
    }
  });
});

describe("createDshDreamClient (DreamTimerClient-shaped facade)", () => {
  it("creates a session and serves the direct-LLM turn via prompt + messages + delete", async () => {
    const { db, cleanup } = await openDb();
    try {
      const calls: GenerateOptions[] = [];
      const { ctx } = makeFakeCtx({ llm: stubLlm({ text: "dreamer answer", calls }) });
      const facade = createDshDreamClient(ctx, { db });

      const created = await facade.session.create({
        body: { title: "dream" },
        query: { directory: "/workspace" },
      });
      expect(typeof created.id).toBe("string");

      await facade.session.prompt({
        path: { id: created.id },
        query: { directory: "/workspace" },
        body: {
          agent: "dreamer-classifier",
          system: "classify now",
          parts: [{ type: "text", text: "memory content" }],
        },
      });

      expect(calls).toHaveLength(1);
      const options = calls[0]!;
      expect(options.provider).toBe("deepseek"); // fallback current route
      expect(options.model).toBe("deepseek-chat");
      expect(options.system).toBe("classify now");
      expect(options.purpose).toBeUndefined(); // ordinary auxiliary call
      const userMessage = options.messages[0] as unknown as {
        role: string;
        content: Array<{ type: string; text: string }>;
      };
      expect(userMessage.role).toBe("user");
      expect(userMessage.content[0]?.text).toContain("memory content");

      const response = await facade.session.messages({
        path: { id: created.id },
        query: { limit: 50 },
      });
      expect(response.data).toHaveLength(2);
      expect(extractLatestAssistantText(response.data)).toBe("dreamer answer");

      await facade.session.delete({ path: { id: created.id } });
      expect((await facade.session.messages({ path: { id: created.id } })).data).toEqual([]);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("runs a tool-requiring dream agent as a tool-scoped subagent worker", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { service, starts } = stubSubagents();
      const calls: GenerateOptions[] = [];
      const parent = { session: { header: {} } } as never;
      const { ctx } = makeFakeCtx({ llm: stubLlm({ calls }), subagents: service });
      const facade = createDshDreamClient(ctx, {
        db,
        parentAgent: (directory) => (directory === PROJECT_A ? parent : undefined),
      });

      const { id } = await facade.session.create({ query: { directory: PROJECT_A } });
      await facade.session.prompt({
        path: { id },
        body: { agent: "dreamer-memory-mapper", parts: [{ type: "text", text: "map the sources" }] },
      });

      // Spawned as a depth-0 worker with the core's read-only profile, minus the
      // OpenCode-only aft_* tools DSH does not ship.
      expect(starts).toHaveLength(1);
      expect(starts[0]?.provider).toBe("spawn");
      const request = starts[0]?.request as {
        maxDepth?: number;
        label?: string;
        toolFilter?: { allow?: string[] };
      };
      expect(request.maxDepth).toBe(0);
      expect(request.label).toBe("magic-dream-dreamer-memory-mapper");
      expect(request.toolFilter?.allow).toEqual(["read", "grep", "glob"]);
      // The direct-LLM path was NOT used for a tool-requiring agent.
      expect(calls).toHaveLength(0);

      const messages = (await facade.session.messages({ path: { id } })).data as Array<{
        parts: Array<{ type: string; text?: string }>;
      }>;
      const assistant = messages[messages.length - 1];
      expect(
        assistant?.parts.some((part) => part.type === "text" && part.text === "worker mapped the sources"),
      ).toBe(true);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("reports a permanent failure when no live session can parent the worker", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { service, starts } = stubSubagents();
      const { ctx } = makeFakeCtx({ llm: stubLlm(), subagents: service });
      const facade = createDshDreamClient(ctx, { db, parentAgent: () => undefined });
      const { id } = await facade.session.create({ query: { directory: PROJECT_A } });

      let message = "";
      await expect(
        facade.session.prompt({
          path: { id },
          body: { agent: "dreamer-memory-mapper", parts: [{ type: "text", text: "x" }] },
        }),
      ).rejects.toThrow(/no live session to spawn from/);
      try {
        await facade.session.prompt({
          path: { id },
          body: { agent: "dreamer-memory-mapper", parts: [{ type: "text", text: "x" }] },
        });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(starts).toHaveLength(0);
      // The core classifies a failure as TRANSIENT (hot-retry every tick) when the
      // message matches this vocabulary. This condition is structural, so the
      // wording must stay out of it.
      expect(message).not.toMatch(
        /abort|lease|timeout|timed out|econn|socket|network|rate.?limit|429|503|overloaded|sqlite_busy|database is locked/i,
      );
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("keeps the write-capable dream agent deferred, with a reason", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { service, starts } = stubSubagents();
      const parent = { session: { header: {} } } as never;
      const { ctx } = makeFakeCtx({ llm: stubLlm(), subagents: service });
      const facade = createDshDreamClient(ctx, { db, parentAgent: () => parent });
      const { id } = await facade.session.create({ query: { directory: PROJECT_A } });

      await expect(
        facade.session.prompt({
          path: { id },
          body: { agent: "dreamer-docs", parts: [{ type: "text", text: "x" }] },
        }),
      ).rejects.toThrow(/not wired on DSH/);
      // Even with a live parent, a write-capable agent must not spawn.
      expect(starts).toHaveLength(0);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("keeps zero-tool dream agents on the direct-LLM path", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { service, starts } = stubSubagents();
      const calls: GenerateOptions[] = [];
      const parent = { session: { header: {} } } as never;
      const { ctx } = makeFakeCtx({ llm: stubLlm({ calls }), subagents: service });
      const facade = createDshDreamClient(ctx, { db, parentAgent: () => parent });
      const { id } = await facade.session.create({ query: { directory: PROJECT_A } });

      await facade.session.prompt({
        path: { id },
        body: { agent: "dreamer-classifier", parts: [{ type: "text", text: "classify" }] },
      });

      expect(starts).toHaveLength(0);
      expect(calls).toHaveLength(1);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("publishes and resolves live parent agents per project, ignoring empty ones", async () => {
    const registry = createDreamParentRegistry();
    const agent = { session: { header: {} } } as never;
    registry.remember("dir:/tmp/proj", agent as never);
    expect(registry.resolve("dir:/tmp/proj")).toBe(agent as never);
    expect(registry.resolve("dir:/tmp/other")).toBeUndefined();
    registry.remember(undefined, agent as never);
    registry.remember("   ", agent as never);
    expect(registry.resolve("")).toBeUndefined();
  });

  it("propagates LLM error / abort / empty output as rejected prompts", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { ctx } = makeFakeCtx({
        llm: stubLlm({ finish: { kind: "error", failure: { message: "boom", code: "X" } } }),
      });
      const facade = createDshDreamClient(ctx, { db });
      const { id } = await facade.session.create({});
      await expect(
        facade.session.prompt({ path: { id }, body: { parts: [{ type: "text", text: "x" }] } }),
      ).rejects.toThrow(/LLM stream failed \(boom\)/);

      const { ctx: abortedCtx } = makeFakeCtx({
        llm: stubLlm({ finish: { kind: "aborted", failure: { message: "gone", code: "X" } } }),
      });
      const abortedFacade = createDshDreamClient(abortedCtx, { db });
      const { id: abortedId } = await abortedFacade.session.create({});
      await expect(
        abortedFacade.session.prompt({ path: { id: abortedId }, body: { parts: [{ type: "text", text: "x" }] } }),
      ).rejects.toThrow(/LLM stream failed \(aborted\)/);

      const { ctx: emptyCtx } = makeFakeCtx({ llm: stubLlm({ text: "" }) });
      const emptyFacade = createDshDreamClient(emptyCtx, { db });
      const { id: emptyId } = await emptyFacade.session.create({});
      await expect(
        emptyFacade.session.prompt({ path: { id: emptyId }, body: { parts: [{ type: "text", text: "x" }] } }),
      ).rejects.toThrow(/returned no text/);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("honors the per-attempt body.model override and an already-aborted signal", async () => {
    const { db, cleanup } = await openDb();
    try {
      const calls: GenerateOptions[] = [];
      const { ctx } = makeFakeCtx({ llm: stubLlm({ calls }) });
      const facade = createDshDreamClient(ctx, { db });
      const { id } = await facade.session.create({});
      await facade.session.prompt({
        path: { id },
        body: {
          model: { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
          parts: [{ type: "text", text: "x" }],
        },
      });
      expect(calls[0]?.provider).toBe("anthropic");
      expect(calls[0]?.model).toBe("claude-sonnet-4-6");

      const aborted = new AbortController();
      aborted.abort();
      await expect(
        facade.session.prompt({ path: { id }, signal: aborted.signal, body: { parts: [{ type: "text", text: "x" }] } }),
      ).rejects.toThrow("prompt aborted by external signal");
    } finally {
      db.close();
      await cleanup();
    }
  });
});

describe("dshDreamSeams (/ctx-dream seam)", () => {
  it("returns tasks/executor/runnable/scheduleSummary for the default enabled config", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { ctx } = makeFakeCtx({ llm: stubLlm() });
      const seam = dshDreamSeams(ctx, { db });
      // Default config enables every canonical task EXCEPT maintain-docs
      // (core DEFAULT_TASK_SCHEDULES leaves it "" — disabled).
      const enabledTasks = CANONICAL_DREAM_TASKS.filter((task) => task !== "maintain-docs");
      expect(seam.tasks.map((task) => task.task)).toEqual([...enabledTasks]);
      expect(seam.tasks.every((task) => task.schedule.trim() !== "")).toBe(true);
      expect(seam.runnable).toBe(true);
      expect(typeof seam.scheduleSummary).toBe("string");
      expect(seam.scheduleSummary).toContain("map-memories 0 2 * * *");
      expect(typeof seam.executor).toBe("function");
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("reports runnable=false when compaction-off is configured", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { ctx } = makeFakeCtx({ llm: stubLlm() });
      const seam = dshDreamSeams(ctx, { db, compactionOff: true });
      expect(seam.runnable).toBe(false);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("seam runnable reflects registerDshDreamer's disabled config", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { ctx } = makeFakeCtx({ llm: stubLlm() });
      registerDshDreamer(ctx, {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: "/tmp", livenessPath: "/tmp/l" }),
          canonicalKey: (id: string) => `dsh:abc:${id}`,
        },
        config: { enabled: false },
        log: () => {},
      });
      const seam = dshDreamSeams(ctx, { db });
      expect(seam.runnable).toBe(false);
    } finally {
      db.close();
      await cleanup();
    }
  });

  it("executor completes a no-LLM path (compress-cues without mural) and records dream telemetry", async () => {
    const { db, cleanup } = await openDb();
    try {
      const { ctx } = makeFakeCtx({ llm: stubLlm() });
      const seam = dshDreamSeams(ctx, { db });
      const outcome = await seam.executor(
        { task: "compress-cues", schedule: "", timeoutMinutes: 20 },
        { db, projectIdentity: PROJECT_A, holderId: "test-holder", leaseKey: `memory:${PROJECT_A}` },
      );
      expect(outcome.status).toBe("completed");
      const runs = getDreamRuns(db, PROJECT_A);
      expect(runs.some((run) => run.tasks_json.includes("compress-cues"))).toBe(true);
    } finally {
      db.close();
      await cleanup();
    }
  });
});

describe("registerDshDreamer (schedule timer)", () => {
  it("registers one interval per discovered project; ticks seed the scheduler state", async () => {
    const { db, cleanup } = await openDb();
    const captured = captureIntervals();
    try {
      insertSessionProject(db, "s1", "dsh", PROJECT_A);
      insertSessionProject(db, "s2", "dsh", PROJECT_B);
      insertSessionProject(db, "s3", "opencode", "git:/tmp/oc-proj"); // excluded
      const logs: string[] = [];
      const { ctx, disposers } = makeFakeCtx({});
      registerDshDreamer(ctx, {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: "/tmp", livenessPath: "/tmp/l" }),
          canonicalKey: (id: string) => `dsh:abc:${id}`,
        },
        directory: "/workspace",
        config: { enabled: true, tickMs: 1000 },
        log: (message) => logs.push(message),
      });
      await flush();

      expect(captured.set).toHaveLength(2);
      expect(captured.set.map((interval) => interval.ms)).toEqual([1000, 1000]);
      expect(logs.some((m) => m.includes(`registered schedule timer for ${PROJECT_A}`))).toBe(true);

      // The immediate initial pass already ran the core scheduler: every
      // canonical task has a seeded row — scheduled tasks with a future
      // next_due_at and no run, maintain-docs (default-disabled) with NULL.
      for (const project of [PROJECT_A, PROJECT_B]) {
        const states = getTaskScheduleStatesForProject(db, project);
        expect(states.map((state) => state.task).sort()).toEqual([...CANONICAL_DREAM_TASKS].sort());
        for (const state of states) {
          if (state.task === "maintain-docs") {
            expect(state.nextDueAt).toBeNull();
          } else {
            expect(state.nextDueAt).toBeGreaterThan(Date.now() - 60_000);
          }
          expect(state.lastStatus).toBeNull();
        }
      }

      // Firing a captured tick is safe with nothing due (no LLM) and keeps the
      // state stable.
      captured.set[0]!.fn();
      await flush();
      expect(getTaskScheduleStatesForProject(db, PROJECT_A)).toHaveLength(CANONICAL_DREAM_TASKS.length);

      // Fiber disposal stops every interval.
      for (const dispose of disposers) dispose();
      expect(captured.set.every((interval) => interval.disposed)).toBe(true);
    } finally {
      __test.reset();
      db.close();
      await cleanup();
    }
  });

  it("does not register intervals when dreamer is disabled", async () => {
    const { db, cleanup } = await openDb();
    const captured = captureIntervals();
    try {
      insertSessionProject(db, "s1", "dsh", PROJECT_A);
      const logs: string[] = [];
      const { ctx } = makeFakeCtx({});
      registerDshDreamer(ctx, {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: "/tmp", livenessPath: "/tmp/l" }),
          canonicalKey: (id: string) => `dsh:abc:${id}`,
        },
        config: { enabled: false },
        log: (message) => logs.push(message),
      });
      await flush();
      expect(captured.set).toHaveLength(0);
      expect(logs.some((m) => m.includes("disabled"))).toBe(true);
    } finally {
      __test.reset();
      db.close();
      await cleanup();
    }
  });

  it("does not register intervals when the host bootstrap is refused", async () => {
    const { db, cleanup } = await openDb();
    const captured = captureIntervals();
    try {
      const logs: string[] = [];
      const { ctx } = makeFakeCtx({});
      registerDshDreamer(ctx, {
        host: {
          ready: Promise.resolve({ kind: "refused", reason: "schema-fence", detail: null }),
          canonicalKey: (id: string) => `dsh:abc:${id}`,
        },
        log: (message) => logs.push(message),
      });
      await flush();
      expect(captured.set).toHaveLength(0);
      expect(logs.some((m) => m.includes("schema-fence"))).toBe(true);
    } finally {
      __test.reset();
      db.close();
      await cleanup();
    }
  });

  it("defaults tickMs to 15 minutes", async () => {
    const { db, cleanup } = await openDb();
    const captured = captureIntervals();
    try {
      insertSessionProject(db, "s1", "dsh", PROJECT_A);
      const { ctx } = makeFakeCtx({});
      registerDshDreamer(ctx, {
        host: {
          ready: Promise.resolve({ kind: "ok", db, storageDir: "/tmp", livenessPath: "/tmp/l" }),
          canonicalKey: (id: string) => `dsh:abc:${id}`,
        },
        log: () => {},
      });
      await flush();
      expect(captured.set).toHaveLength(1);
      expect(captured.set[0]?.ms).toBe(DEFAULT_DREAM_TICK_MS);
    } finally {
      __test.reset();
      db.close();
      await cleanup();
    }
  });
});
