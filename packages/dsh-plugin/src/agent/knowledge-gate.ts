/**
 * agent/knowledge-gate — the first-step knowledge injection gate (Phase 2
 * slice A).
 *
 * Registered on `agent/pre-step` with `prepend: true` (outermost, via the
 * compat seam registerPreStepGate). The gate:
 *
 *   1. awaits the host `magicContextHost.ready` bootstrap (fail-open on
 *      refusal);
 *   2. attributes the session to its project (`session_projects`, once per
 *      session — see session-track.ts);
 *   3. injects the Magic knowledge baseline — core m[0]/m[1] through
 *      mustMaterialize / materializeWithRetry (which internally renders m[1]
 *      and persists the cached m[0] via persistCachedM0) or, on a cache-valid
 *      defer pass, replays the persisted bytes — ONCE per session per surface
 *      generation (in-memory Map<sessionId, generation>) with a content
 *      watermark de-dup against the visible surface (resume safety);
 *   4. fires the auto-search hint evaluation for the incoming user message
 *      (fire-and-forget, see auto-search.ts);
 *   5. passes the pre-step decision through untouched (`await next()`).
 *
 * Injection timing (verified against the 0.1.7-alpha.2 runtime): the baseline
 * rides BOTH delivery channels, and the pair is de-duplicated on the way in:
 *
 *   - `payload.messages.unshift(...)` — the pre-step decision's `messages`
 *     array is exactly what the runtime appends to the surface, so this is the
 *     path that makes the baseline visible to THIS step's request (Pi transform
 *     unshift semantics; the runtime delivers its own runtime-context the same
 *     way). It is NOT side-effect free: the prepended messages become surface
 *     nodes.
 *   - `agent.inject(...)` — the durable next-step inbox
 *     (`ReactLoopAgent.inject` → `inbox.splice("next-step", …)`), claimed and
 *     appended by the FOLLOWING step. It is the fallback for a pass whose
 *     prepend never landed.
 *
 * Both channels materialize the SAME message objects, so the queued copy would
 * be appended a second time with an unchanged id. The DSH client keys
 * conversation nodes by message id, so a duplicated id breaks the entire
 * conversation view (memory #411). dropAlreadySurfacedMagicMessages() removes
 * from the incoming batch any Magic message that is already a live surface
 * node: the queued copy is redundant once the prepended one landed, and it is
 * still appended when the prepend did not land.
 *
 * Knowledge-mode preview: `compactionOff: true` by default — the zero-
 * compartment path where m[0] carries memory/docs/user-profile only and
 * historical compartments never render.
 */
import { createHash } from "node:crypto";
import type { Context } from "@deepseek-ai/cordis";
import type { SessionId } from "@deepseek-ai/dsh-session";
import type { UserMessage } from "@deepseek-ai/dsh-llm";
import {
  mustMaterialize,
  materializeWithRetry,
  renderM1,
  type M0HardSignals,
  type M0M1RenderOptions,
  type M0M1State,
  type M0SnapshotMarkers,
  type MaterializeM0Result,
} from "@magic-context/core/hooks/magic-context/inject-compartments";
import { getOrCreateSessionMeta } from "@magic-context/core/features/magic-context/storage";
import { resolveCacheTtl } from "@magic-context/core/hooks/magic-context/event-resolvers";
import { buildSyntheticTodoPart } from "@magic-context/core/hooks/magic-context/todo-view";
import { consumeDshDeferredSignals } from "./historian";
import { parseCacheTtl } from "@magic-context/core/features/magic-context/scheduler";
import { resolveProjectIdentityForSession } from "@magic-context/core/features/magic-context/memory/project-identity";
import type { Database } from "@magic-context/core/shared/sqlite";
import { isMagicSource, magicUserMessage, sessionEvents, findEventBySeq, type MagicMessageSource, MAGIC_SOURCE_KIND } from "../compat/dsh-0.1/session";
import {
  registerPreStepGate,
  type PreStepDecision,
  type PreStepPayload,
} from "../compat/dsh-0.1/prestep";
import type { DshStorageBootstrap } from "../host/bootstrap";
import { trackSessionProjectOnce, sessionProjectPath } from "./session-track";
import { maybeRunAutoSearchHint, type AutoSearchConfig } from "./auto-search";
import { isMagicChildSession } from "./worker";

/** The host-service slice the gate needs (structural view). */
export interface KnowledgeGateHostView {
  /** Settles once the storage bootstrap finishes (ok or refused). */
  readonly ready: Promise<DshStorageBootstrap>;
  /** Canonical Magic session key for a DSH session. */
  canonicalKey(dshSessionId: string): string;
}

/** Knowledge (m0/m1) gate options surfaced in the agent plugin config. */
export interface KnowledgeConfig {
  enabled?: boolean;
  /** Session workspace directory (fallback when the header has no cwd). */
  directory?: string;
  /** m[0] includes the <project-docs> block (default true). */
  injectDocs?: boolean;
  /** Zero-compartment knowledge-mode path (default true — preview mode). */
  compactionOff?: boolean;
  memoryInjectionBudgetTokens?: number;
  historyBudgetTokens?: number;
  userProfileBudgetTokens?: number;
  muralEnabled?: boolean;
  /** Provider-side cache TTL ("5m", "1h", ...) for the HARD-bust signal. */
  cacheTtl?: string;
}

export interface KnowledgeGateDeps {
  readonly host: KnowledgeGateHostView;
  readonly config: KnowledgeConfig;
  readonly autoSearch: AutoSearchConfig;
  /** Mural image injection (Phase 4): vision-gated image block on m0. */
  readonly mural?: {
    /** Master switch (config mural.enabled). */
    enabled?: boolean;
    /** Vision gate for the session's model (production: modelSupportsVision). */
    supportsVision?: (agent: KnowledgeAgentView) => boolean;
    /** Persist the mural data URL as an attachment and return the image block. */
    resolveImage?: (dataUrl: string) => Promise<unknown | null>;
  };
  /** Injectable clock (tests). */
  readonly now?: () => number;
  /**
   * Record the live top-level agent for a project.
   *
   * The Dreamer's tool-requiring tasks run as SUBAGENT workers, and
   * `ctx.subagents.start` needs a live `parent: Agent` — which the background
   * timer does not have. This gate is the outermost pre-step listener, so it
   * sees every top-level agent and is the natural place to publish one per
   * project (see dreamer.ts `createDreamParentRegistry`). Child sessions never
   * reach this point, so a worker can never become a parent.
   */
  readonly rememberAgent?: (
    directory: string | undefined,
    agent: import("@deepseek-ai/dsh-agent").Agent,
  ) => void;
  readonly log?: (message: string) => void;
}

/** Per-plugin gate state (owned by the registration, reset on plugin reload). */
export interface KnowledgeGateState {
  /** sessionId → surface generation already injected for. */
  readonly injectedGenerations: Map<string, number>;
  /** sessionId → project attribution already recorded for. */
  readonly trackedSessions: Set<string>;
  /**
   * sessionId → messages injected by THAT session's most recent pass.
   *
   * Keyed by session because this state is owned by the registration, which is
   * created once per profile and therefore shared by every session and every
   * agent in it. A bare array here let one session's baseline be prepended into
   * another session's step (the guard then checks the WRONG session's surface,
   * finds no watermark, and lets it through), and let a second session's
   * assignment drop the first session's stash entirely.
   */
  readonly lastInjectedMessages: Map<string, unknown[]>;
}

export function createKnowledgeGateState(): KnowledgeGateState {
  return { injectedGenerations: new Map(), trackedSessions: new Set(), lastInjectedMessages: new Map() };
}

/** The per-session prepend stash, created on first use. */
function injectedStash(state: KnowledgeGateState, magicSessionId: string): unknown[] {
  let stash = state.lastInjectedMessages.get(magicSessionId);
  if (stash === undefined) {
    stash = [];
    state.lastInjectedMessages.set(magicSessionId, stash);
  }
  return stash;
}

/**
 * The Magic watermarks already present in an incoming step batch.
 *
 * This is the batch-side half of the de-dup question. The surface cannot answer
 * it: messages claimed into this step are appended to the surface only AFTER the
 * pre-step decision resolves, so at decision time they exist nowhere but here.
 */
function collectMagicWatermarks(messages: readonly unknown[]): Set<string> {
  const watermarks = new Set<string>();
  for (const message of messages) {
    const source = (message as { source?: MagicMessageSource | { kind?: string } } | undefined)?.source;
    if (source === undefined || source === null || !isMagicSource(source)) continue;
    const watermark = (source as MagicMessageSource).messageId;
    if (typeof watermark === "string" && watermark.length > 0) watermarks.add(watermark);
  }
  return watermarks;
}

/** The session surface slice the gate reads (test-friendly structural view). */
export interface KnowledgeSessionView {
  readonly surface: { readonly nodes: readonly number[]; readonly replaceGeneration: number };
  readonly events: readonly unknown[];
  readonly header: { readonly cwd?: string };
}

/** The agent slice the gate drives (structural view over DSH Agent). */
export interface KnowledgeAgentView {
  readonly id: SessionId;
  readonly options: { readonly provider?: string; readonly model?: string };
  readonly session: KnowledgeSessionView;
  inject(message: UserMessage): void;
}

/** One materialized knowledge payload ready for injection. */
export interface KnowledgeBlocks {
  readonly m0Text: string;
  readonly m1Text: string;
  /** Combined model-facing text (m0 + optional m1 delta). */
  readonly text: string;
  readonly watermark: string;
  readonly revision: string;
  readonly digest: string;
}

/**
 * Mirror of the core's M1 "nothing new" placeholder (inject-compartments.ts).
 * The adapter strips it so the model never sees the "no new content" stub.
 */
const M1_EMPTY_PLACEHOLDER =
  "<session-history-since>(no new content since last materialization)</session-history-since>";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function decodeUtf8(bytes: Buffer | null | undefined): string | null {
  if (bytes === null || bytes === undefined) return null;
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("utf8");
}

/** Provider/model key for the HARD-bust signal ("provider/model", or ""). */
function modelKeyOf(agent: KnowledgeAgentView): string {
  const { provider, model } = agent.options;
  if (!provider || !model) return "";
  return `${provider}/${model}`;
}

/** Compute the runtime HARD-bust signals (system/model/TTL idle). */
export function computeHardSignals(
  deps: Pick<KnowledgeGateDeps, "config" | "now">,
  meta: { systemPromptHash?: string | number; lastResponseTime: number },
  agent: KnowledgeAgentView,
): M0HardSignals {
  const modelKey = modelKeyOf(agent);
  const rawSystemHash = typeof meta.systemPromptHash === "string" ? meta.systemPromptHash : "";
  const systemHash =
    rawSystemHash !== "" && rawSystemHash !== "0" ? rawSystemHash : "";
  let cacheExpired = false;
  if (meta.lastResponseTime > 0) {
    try {
      const ttl = resolveCacheTtl(deps.config.cacheTtl ?? "5m", modelKey || undefined);
      const ttlMs = parseCacheTtl(ttl);
      const now = deps.now?.() ?? Date.now();
      cacheExpired = now - meta.lastResponseTime > ttlMs;
    } catch {
      cacheExpired = false;
    }
  }
  return { systemHash, modelKey, cacheExpired, lastResponseTime: meta.lastResponseTime };
}

/**
 * Core pipeline: mustMaterialize → materializeWithRetry (m0/m1 render +
 * persistCachedM0, contention-retried) or, on a cache-valid defer pass, replay
 * the persisted bytes. Returns the injection-ready blocks + content watermark.
 */
export function materializeKnowledgeBlocks(
  deps: KnowledgeGateDeps,
  db: Database,
  magicSessionId: string,
  projectPath: string | undefined,
  directory: string | undefined,
  agent: KnowledgeAgentView,
  forceMaterialize = false,
): KnowledgeBlocks | null {
  const meta = getOrCreateSessionMeta(db, magicSessionId);
  const state = meta as unknown as M0M1State;
  const hardSignals = computeHardSignals(deps, meta, agent);
  const renderOptions: M0M1RenderOptions = {
    db,
    sessionId: magicSessionId,
    state,
    projectPath,
    // projectDirectory is the FILESYSTEM directory (docs read); projectPath is
    // the canonical project identity (memory lookup). Keep them distinct.
    projectDirectory: directory ?? "",
    injectDocs: deps.config.injectDocs ?? true,
    // Pi parity: compartments render into <session-history> by default;
    // only compaction.enabled=false (compaction-off mode) empties them.
    compactionOff: deps.config.compactionOff ?? false,
    memoryInjectionBudgetTokens: deps.config.memoryInjectionBudgetTokens,
    historyBudgetTokens: deps.config.historyBudgetTokens,
    userProfileBudgetTokens: deps.config.userProfileBudgetTokens,
    muralEnabled: deps.config.muralEnabled ?? false,
    hardSignals,
  };

  const decision = forceMaterialize
    ? { value: true, reason: "deferred_materialization" }
    : mustMaterialize({
        db,
        sessionId: magicSessionId,
        state,
        projectPath,
        hardSignals,
        injectDocs: renderOptions.injectDocs,
        muralEnabled: renderOptions.muralEnabled,
        memoryInjectionBudgetTokens: renderOptions.memoryInjectionBudgetTokens,
        historyBudgetTokens: renderOptions.historyBudgetTokens,
      });

  let m0Text: string;
  let m1Text: string;
  let markers: M0SnapshotMarkers | null;
  let materializedAt: number;

  if (decision.value) {
    const result: MaterializeM0Result = materializeWithRetry(renderOptions);
    m0Text = result.m0Text;
    m1Text = result.m1Text;
    markers = result.snapshotMarkers;
    materializedAt = result.snapshotMarkers.materializedAt;
    // Hold the markers for in-process defer passes (fresh m1 delta rendering).
    state.snapshotMarkers = result.snapshotMarkers;
  } else {
    // Defer: replay the persisted baseline bytes.
    m0Text = decodeUtf8(state.cachedM0Bytes) ?? "";
    m1Text = decodeUtf8(state.cachedM1Bytes) ?? "";
    materializedAt = state.cachedM0MaterializedAt ?? 0;
    markers = state.snapshotMarkers ?? null;
    if (markers) {
      // Fresh m1 delta against the held markers so additive memories surface
      // even when the cache is valid (soft refresh, non-persisted).
      try {
        const fresh = renderM1(renderOptions, markers, []);
        if (fresh && fresh.trim().length > 0 && fresh !== M1_EMPTY_PLACEHOLDER) {
          m1Text = fresh;
        }
      } catch {
        // Keep the cached m1 on any marker mismatch.
      }
    }
  }

  if (m0Text.length === 0) return null;

  const m1Part =
    m1Text.trim().length > 0 && m1Text !== M1_EMPTY_PLACEHOLDER ? `\n\n${m1Text}` : "";
  const text = `${m0Text}${m1Part}`;
  const digest = sha256Hex(text).slice(0, 16);
  const revision = String(materializedAt);
  return {
    m0Text,
    m1Text,
    text,
    watermark: `mc-kb:${revision}:${digest}`,
    revision,
    digest,
  };
}

/**
 * Watermark de-dup against the VISIBLE surface: true when a Magic knowledge
 * message with this watermark is already a live surface node (resume replay —
 * the durable log still carries it, so a restarted process must not re-inject).
 * Replaced (shadowed) nodes do not count, so a compacted session re-injects.
 *
 * `onMisaligned` reports a seq lookup that had to fall back to a scan. That is
 * not noise: an off-by-index read here silently answers "not on surface", which
 * is precisely how a duplicate id got past this guard.
 */
export function isMagicWatermarkOnSurface(
  session: KnowledgeSessionView,
  watermark: string,
  onMisaligned?: (detail: string) => void,
): boolean {
  const events = sessionEvents(session);
  for (const seq of session.surface.nodes) {
    const event = findEventBySeq(events, seq, onMisaligned) as
      | { type?: string; data?: { source?: MagicMessageSource | { kind?: string } } }
      | undefined;
    if (!event || event.type !== "user/message") continue;
    const source = event.data?.source;
    if (
      source &&
      isMagicSource(source) &&
      (source as MagicMessageSource).messageId === watermark
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Remove from the incoming pre-step batch every Magic message that would land a
 * DUPLICATE surface node, and return how many were removed. Two independent
 * reasons, both of which must hold:
 *
 *  1. the watermark is already a LIVE surface node — DSH appends the pre-step
 *     decision's `messages` to the surface while `agent.inject()` queues the
 *     same objects for the next step, so the next step claims them and appends a
 *     second node carrying an unchanged message id;
 *  2. the watermark appears EARLIER IN THIS SAME BATCH — the batch can carry the
 *     same baseline from more than one producer in one step, which lands two
 *     nodes with one message id just as surely.
 *
 * The client keys conversation nodes by that id, so either duplicate throws
 * "conversation Context ... received more than one start Match" and the whole
 * conversation renders empty (memory #411).
 *
 * Shadowed (replaced/compacted) nodes do not count — a new surface generation
 * legitimately re-delivers the same watermark — and messages without a
 * watermark (user turns, runtime context) are never touched.
 */
export function dropAlreadySurfacedMagicMessages(
  agent: KnowledgeAgentView,
  messages: unknown[],
  log?: (message: string) => void,
): number {
  const seenInBatch = new Set<string>();
  let removed = 0;
  let index = 0;
  while (index < messages.length) {
    const source = (messages[index] as { source?: MagicMessageSource | { kind?: string } } | undefined)
      ?.source;
    if (!source || !isMagicSource(source)) {
      index += 1;
      continue;
    }
    const watermark = (source as MagicMessageSource).messageId;
    if (typeof watermark !== "string" || watermark.length === 0) {
      index += 1;
      continue;
    }
    const duplicateInBatch = seenInBatch.has(watermark);
    seenInBatch.add(watermark);
    const onSurface = isMagicWatermarkOnSurface(agent.session, watermark, (detail) =>
      log?.(`[magic-context] watermark lookup note: ${detail}`),
    );
    if (!duplicateInBatch && !onSurface) {
      index += 1;
      continue;
    }
    messages.splice(index, 1);
    removed += 1;
    log?.(
      `[magic-context] dropped redundant Magic message ${watermark} from the pre-step batch ` +
        `(${duplicateInBatch ? "already earlier in this batch" : "already on the surface"})`,
    );
  }
  return removed;
}

/**
 * Inject the knowledge baseline once per (session, surface generation).
 *
 * `incomingWatermarks` are the Magic watermarks already present in the step
 * batch this pass is about to decide on. They are a THIRD place the same
 * baseline can already be, next to "on the surface" and "in this gate's stash",
 * and the only one that is invisible from `agent.session`: the previous pass's
 * `agent.inject()` is delivered as THIS step's claim, and the surface append has
 * not happened yet when the decision runs. Checking only the surface made the
 * gate keep the claimed copy AND create a fresh one, landing two nodes with one
 * watermark — the duplicate-id class that empties the conversation view.
 */
export async function maybeInjectKnowledge(
  state: KnowledgeGateState,
  deps: KnowledgeGateDeps,
  agent: KnowledgeAgentView,
  db: Database,
  magicSessionId: string,
  projectPath: string | undefined,
  directory: string | undefined,
  forceMaterialize = false,
  incomingWatermarks?: ReadonlySet<string>,
): Promise<void> {
  if (deps.config.enabled === false) return;
  const generation = agent.session.surface.replaceGeneration;
  if (state.injectedGenerations.get(magicSessionId) === generation) return;

  const blocks = materializeKnowledgeBlocks(
    deps,
    db,
    magicSessionId,
    projectPath,
    directory,
    agent,
    forceMaterialize,
  );
  if (blocks === null) return;

  if (isMagicWatermarkOnSurface(agent.session, blocks.watermark, (detail) =>
    deps.log?.(`[magic-context] watermark lookup note: ${detail}`),
  )) {
    // Resume: the persisted surface already carries this exact baseline.
    state.injectedGenerations.set(magicSessionId, generation);
    return;
  }

  const baselineM0 = blocks.watermark;
  const baselineM1 = `${blocks.watermark}:m1`;
  if (
    incomingWatermarks !== undefined &&
    (incomingWatermarks.has(baselineM0) || incomingWatermarks.has(baselineM1))
  ) {
    // The same baseline is already riding this step's batch, so injecting again
    // would land a second node under one watermark. Remember the generation so
    // the next step does not retry: the batch copy is this generation's delivery.
    const which = incomingWatermarks.has(baselineM0) ? baselineM0 : baselineM1;
    state.injectedGenerations.set(magicSessionId, generation);
    deps.log?.(
      `[magic-context] knowledge injection skipped for ${magicSessionId}@gen${generation}: ` +
        `the incoming step batch already carries ${which}`,
    );
    return;
  }

  const source: MagicMessageSource = {
    kind: MAGIC_SOURCE_KIND,
    messageId: blocks.watermark,
    revision: blocks.revision,
    digest: blocks.digest,
  };
  // Mural (Phase 4): when enabled + the model supports vision + the m0 fold
  // produced a mural, persist the data URL as an attachment and ride the
  // image block on the injected baseline message. The extra blocks ride the
  // content array of the SAME message (createUserMessage deep-freezes, so the
  // array is assembled before construction).
  const mural = deps.mural;
  let muralBlock: unknown = null;
  if (mural?.enabled === true && (mural.supportsVision?.(agent) ?? false)) {
    try {
      const meta = getOrCreateSessionMeta(db, magicSessionId) as unknown as {
        cachedM0MuralDataUrl?: string | null;
      };
      const dataUrl = meta.cachedM0MuralDataUrl;
      if (typeof dataUrl === "string" && dataUrl.length > 0 && mural.resolveImage !== undefined) {
        muralBlock = await mural.resolveImage(dataUrl);
      }
    } catch (error) {
      deps.log?.(
        `[magic-context] mural injection skipped (fail-open): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const muralBlocks =
    muralBlock === null || muralBlock === undefined
      ? []
      : ([muralBlock] as unknown as Parameters<typeof magicUserMessage>[2]);
  // Pi 语义：m0 与 m1 是两条独立合成 user 消息（m0/m1 缓存分裂契约）。
  const m0Message = magicUserMessage(blocks.m0Text, source, muralBlocks);
  const m1Source: MagicMessageSource = {
    ...source,
    messageId: `${blocks.watermark}:m1`,
  };
  const m1Message = magicUserMessage(blocks.m1Text, m1Source, []);
  agent.inject(m0Message);
  agent.inject(m1Message);
  // Synthetic todowrite replay (Magic todo-view parity): this pass IS a
  // cache-bust (HARD materialization) — resurface the last todo snapshot so
  // the model regains its task list after the fold, exactly like OpenCode/Pi
  // ride the synthetic pair on cache-busting passes. DSH delivery keeps the
  // inject + watermark semantics; the part is rendered in the DSH folded
  // tool-call text shape the model already sees.
  try {
    const meta = getOrCreateSessionMeta(db, magicSessionId) as unknown as {
      lastTodoState?: string | null;
    };
    const todoState = meta.lastTodoState ?? null;
    if (typeof todoState === "string" && todoState.length > 0) {
      const part = buildSyntheticTodoPart(todoState);
      if (part !== null) {
        const todoWatermark = `mc-todo:${sha256Hex(todoState).slice(0, 16)}`;
        if (!isMagicWatermarkOnSurface(agent.session, todoWatermark)) {
          const callId = part.callID;
          const inputText = JSON.stringify(part.state.input);
          const todoText =
            `[tool: todowrite #${callId}]\ninput: ${inputText}\n\n` +
            `[tool result: todowrite #${callId}]\noutput: ${part.state.output}`;
          const todoSource: MagicMessageSource = {
            kind: MAGIC_SOURCE_KIND,
            messageId: todoWatermark,
          };
          const todoMessage = magicUserMessage(todoText, todoSource, []);
          agent.inject(todoMessage);
          injectedStash(state, magicSessionId).push(todoMessage);
        }
      }
    }
  } catch {
    // Todo replay must never break injection (fail-open).
  }
  state.injectedGenerations.set(magicSessionId, generation);
  // 首轮 pre-step 前置用：本次 LLM 调用即可见（Pi transform unshift 语义）。
  const stash = injectedStash(state, magicSessionId);
  if (stash.length === 0) {
    stash.push(m0Message, m1Message);
  } else {
    // The stash is non-empty only because the todo replay above pushed into it.
    // Say so out loud: this coupling means a todo replay silently changes
    // whether the baseline is prepended to THIS step or only delivered next step.
    deps.log?.(
      `[magic-context] baseline prepend skipped for ${magicSessionId}@gen${generation}: ` +
        `stash already holds ${stash.length} message(s) (todo replay)`,
    );
  }
  deps.log?.(
    `[magic-context] injected knowledge baseline ${blocks.watermark} for ${magicSessionId}@gen${generation}`,
  );
}

/** Resolve the canonical project identity for a session workspace. */
export function resolveKnowledgeProjectPath(directory: string | undefined): string | undefined {
  if (!directory || directory.length === 0) return undefined;
  try {
    return resolveProjectIdentityForSession(directory) || undefined;
  } catch {
    return undefined;
  }
}

/** Full gate body (host wait → track → knowledge → auto-search → next). */
export async function runKnowledgeGateStep(
  state: KnowledgeGateState,
  deps: KnowledgeGateDeps,
  payload: Pick<PreStepPayload, "agent" | "messages">,
  next: () => Promise<PreStepDecision>,
): Promise<PreStepDecision> {
  const agent = payload.agent as unknown as KnowledgeAgentView;
  try {
    // Recursion isolation (PLAN §9): child sessions (subagents/workers) run
    // with official semantics — no Magic knowledge processing on children.
    if (isMagicChildSession(agent as unknown as import("@deepseek-ai/dsh-agent").Agent)) {
      return await next();
    }
    // Never append a Magic message the live surface already carries, and never
    // append the same watermark twice in one batch: together these are what keep
    // the inject()+prepend pair from creating duplicate surface ids (see the
    // module header and dropAlreadySurfacedMagicMessages).
    const dropped = dropAlreadySurfacedMagicMessages(agent, payload.messages as unknown[], deps.log);
    if (dropped > 0) {
      deps.log?.(`[magic-context] pre-step batch: dropped ${dropped} redundant Magic message(s)`);
    }
    const bootstrap = await deps.host.ready;
    if (bootstrap.kind === "ok") {
      const db = bootstrap.db;
      const magicSessionId = deps.host.canonicalKey(agent.id);
      const directory = sessionProjectPath(agent, deps.config.directory);
      const projectPath = resolveKnowledgeProjectPath(directory);

      // Publish the live agent so a tool-requiring dream task can spawn a worker
      // from it (the dreamer's timer has no agent of its own).
      deps.rememberAgent?.(directory, agent as unknown as import("@deepseek-ai/dsh-agent").Agent);

      // Session → project attribution (once per session).
      trackSessionProjectOnce(state.trackedSessions, db, magicSessionId, projectPath);

      // Historian 发布后的 deferred-materialization 信号（Pi parity）：下一轮
      // pre-step 强制 HARD 物化 → m0 折叠 m1 并渲染 <session-history>。
      const deferred = consumeDshDeferredSignals(magicSessionId);
      // What this batch already carries — the one place the baseline can be that
      // the surface cannot show yet (claimed-but-unappended messages).
      const incomingWatermarks = collectMagicWatermarks(payload.messages as unknown[]);
      // Knowledge baseline (once per surface generation; forced after publish).
      await maybeInjectKnowledge(
        state,
        deps,
        agent,
        db,
        magicSessionId,
        projectPath,
        directory,
        deferred.materialization,
        incomingWatermarks,
      );
      // Pi transform 语义：首轮注入的消息前置到本次调用的消息列表（立即可见）。
      // 前置即写入 surface（运行时把 decision.messages 追加为表面节点），而
      // agent.inject 又把这些同一批对象排进下一步的 inbox —— 下一步的
      // dropAlreadySurfacedMagicMessages 会丢弃这份冗余副本，避免重复 id。
      // 快照按 session 取：这份状态是 profile 级的，裸数组会让一个会话的批次
      // 被另一个会话（或子代理）的前置消费掉。
      const stash = state.lastInjectedMessages.get(magicSessionId);
      if (stash !== undefined && stash.length > 0) {
        state.lastInjectedMessages.delete(magicSessionId);
        (payload.messages as unknown[]).unshift(...(stash as UserMessage[]));
        deps.log?.(
          `[magic-context] prepended ${stash.length} injected Magic message(s) for ${magicSessionId}`,
        );
      }

      // Auto-search hint on the incoming user message — fire-and-forget so the
      // pre-step chain is never delayed by search latency (3s cap inside).
      void maybeRunAutoSearchHint({
        db,
        sessionId: magicSessionId,
        projectPath: projectPath ?? "",
        messages: payload.messages,
        agent,
        config: deps.autoSearch,
        log: deps.log,
      }).catch((error: unknown) => {
        deps.log?.(
          `[magic-context] auto-search crashed (fail-open): ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    } else {
      deps.log?.(
        `[magic-context] knowledge gate skipped: storage bootstrap ${bootstrap.kind} (${String(bootstrap.detail)})`,
      );
    }
  } catch (error) {
    deps.log?.(
      `[magic-context] knowledge gate failed (fail-open): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return await next();
}

/**
 * Register the knowledge gate as the OUTERMOST pre-step listener. The gate
 * never vetoes a step: it delays only until injection readiness and always
 * resolves the downstream decision.
 */
export function registerKnowledgeGate(ctx: Context, deps: KnowledgeGateDeps): () => boolean {
  const state = createKnowledgeGateState();
  return registerPreStepGate(ctx, (payload, next) =>
    runKnowledgeGateStep(state, deps, payload, next),
  );
}
