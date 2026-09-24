/**
 * compat/dsh-0.1/subagent — the minimal worker seam (PLAN §5.13 / D7).
 *
 * Validated in Phase 0 spike-5: capability validation is fail-loud, depth is
 * capped, tool scoping uses `toolFilter`, delegated approval is pinned to
 * 'never'. The adapter does NOT depend on any undeclared `AgentOptions.role`
 * field.
 */
import type { Context } from "@deepseek-ai/cordis";
import type { Agent } from "@deepseek-ai/dsh-agent";
import {
  appendDelegatedPolicyOverrides,
  captureDelegatedPolicyOverrides,
  resolveChildDepth,
  SubagentDepthError,
  type SubagentRuntime,
  type SubagentStartRequest,
} from "@deepseek-ai/dsh-subagent";
import type { ToolRestriction } from "@deepseek-ai/dsh-tools";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";

export {
  SubagentDepthError,
  appendDelegatedPolicyOverrides,
  captureDelegatedPolicyOverrides,
  resolveChildDepth,
};
export type { SubagentRuntime, SubagentStartRequest, ToolRestriction };

/**
 * Read-only tool allowlist for a Magic worker, using DSH's ACTUAL tool names.
 *
 * Verified against the shipped app (2026-09-24): `dsh-tool-fs` registers
 * `read`/`write`/`edit`/`read_image`, `dsh-tool-fs-search` registers
 * `grep`/`glob`, and the shell tool is `dsh-tool-pwsh` → `pwsh` on Windows /
 * `dsh-tool-bash` → `bash` elsewhere. There is NO `fs_search` tool: the earlier
 * value here listed one, and `ToolRuntime.restrict` fails on unknown names
 * ("Empty filters, unknown names, scope-local names ... fail" —
 * dsh-tools/lib/types), so every worker spawn using this list would have thrown
 * and returned null. That is why `runMagicWorker` had never been wired up.
 */
export const MAGIC_WORKER_READONLY_TOOLS: readonly string[] = ["read", "grep", "glob"];

/** The platform's shell tool name, as the preset registers it. */
export function magicShellToolName(platform: string = process.platform): string {
  return platform === "win32" ? "pwsh" : "bash";
}

/**
 * Build the one-shot spawn request for a Magic worker: depth pinned, tools
 * allowlisted, persona marker, parent-bound cancellation.
 */
export function magicWorkerRequest(
  parent: Agent,
  opts: {
    label: string;
    prompt: ContentBlock[];
    allow: readonly string[];
    maxDepth?: number;
    signal: AbortSignal;
    persona?: string;
  },
): SubagentStartRequest {
  return {
    label: opts.label,
    prompt: opts.prompt,
    parent,
    signal: opts.signal,
    maxDepth: opts.maxDepth ?? 1,
    toolFilter: { allow: [...opts.allow] } satisfies ToolRestriction,
    ...(opts.persona === undefined ? {} : { persona: opts.persona }),
  };
}

/** Resolve the subagents service from a context (undefined-safe read). */
export function subagentsOf(ctx: Context): SubagentRuntime | undefined {
  return ctx.get("subagents") as SubagentRuntime | undefined;
}
