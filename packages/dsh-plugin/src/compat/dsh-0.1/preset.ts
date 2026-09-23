/**
 * compat/dsh-0.1/preset — preset declaration for the 0.1.7 inline form.
 *
 * HISTORY. Up to DSH 0.1.6 a user preset was a FILE-backed directory
 * `$DSH_HOME/.agent-presets/<id>/{preset.yml,agent.cordis.yml}`, so this module
 * generated a *thin* preset that included the shipped stock composition and
 * patched it. Nothing reads that directory any more: in 0.1.7 a preset is an
 * ordinary `@deepseek-ai/dsh-agent-preset` declaration row carried by a bundle
 * patch, with the plugin list inline in `config.plugins`. The stock presets
 * (standard/ptc/minimal/cordis) ship as `presets/<id>.patch.yml` of the
 * `@deepseek-ai/dsh-web-app` bundle. `dsh-agent-preset-registry`'s tree only
 * ever holds in-memory state ("A preset is an input, never a persistence
 * target"), and `PresetTree.write()` is a no-op — there is no file to emit.
 *
 * STRATEGY. We override the shipped `preset-standard` row by its Loader id and
 * restate the complete `plugins` list with the Magic rows folded in. An
 * override patch replaces `config` WHOLESALE (never a deep merge), so the
 * restated list must carry every field the shipped row needs.
 *
 * Because of that wholesale replacement, this module cannot be a pure
 * transform of its own inputs: it must know the shipped list. `scanStockPreset…`
 * below verifies the restated layout against the contract we were written
 * for and fails closed when it drifts, so a DSH upgrade surfaces as a clear
 * doctor error instead of a silently degraded agent plane.
 */
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { applyEntryPatches } from "@deepseek-ai/cordis-plugin-include";

/** The Loader row id the shipped Web bundle declares for `standard`. */
export const STOCK_PRESET_ROW_ID = "preset-standard";

/** The preset identity saved by sessions (the declaration's `config.id`). */
export const STOCK_PRESET_CONFIG_ID = "standard";

/** The exact stock rows the guarded patch targets (contract scan constants). */
export const STOCK_COMPACTION_GROUP = {
  id: "compaction",
  name: "cordis:group",
  isolate: { compaction: true, toolResultPruner: true },
} as const;

export const STOCK_COMPACTION_BASIC_ROW = {
  id: "compaction-basic",
  name: "@deepseek-ai/dsh-compaction-basic",
} as const;

/** Rows Magic adds to a preset's plugin list. */
export const MAGIC_AGENT_ROW_ID = "magic-agent";
export const MAGIC_COMPACTION_ROW_ID = "magic-compaction";

/** A loader patch entry (the include plugin's patch list shape). */
export interface PatchEntry {
  readonly id?: string;
  readonly name?: string;
  readonly insert?: readonly Record<string, unknown>[];
  readonly disabled?: boolean;
  readonly config?: unknown;
}

/**
 * Walk a preset plugin list (including nested `group: true` rows) and return
 * the row carrying `rowId`, or undefined. The compaction group is nested, so a
 * shallow find is not enough.
 */
export function findPresetRow(
  plugins: readonly Record<string, unknown>[],
  rowId: string,
): Record<string, unknown> | undefined {
  for (const row of plugins) {
    if (row.id === rowId) return row;
    if (row.group === true && Array.isArray(row.config)) {
      const nested = findPresetRow(row.config as readonly Record<string, unknown>[], rowId);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

/**
 * Contract-scan a restated preset plugin list: verifies the compaction group
 * and compaction-basic row match the expected layout and that Magic's own rows
 * are absent (an override must not double-insert them). Returns a reason when
 * the layout is unknown (fail closed), or undefined when it matches.
 */
export function scanStockPresetLayout(
  plugins: readonly Record<string, unknown>[],
): string | undefined {
  const group = plugins.find((row) => row.id === STOCK_COMPACTION_GROUP.id);
  if (group === undefined) return "compaction group row missing";
  if (group.name !== STOCK_COMPACTION_GROUP.name) return "compaction group name mismatch";
  if (!group.group) return "compaction group is not a group";
  if (JSON.stringify(group.isolate) !== JSON.stringify(STOCK_COMPACTION_GROUP.isolate)) {
    return "compaction group isolate realms mismatch";
  }
  const children = (group.config as readonly Record<string, unknown>[] | undefined) ?? [];
  const basic = children.find((row) => row.id === STOCK_COMPACTION_BASIC_ROW.id);
  if (basic === undefined) return "compaction-basic row missing";
  if (basic.name !== STOCK_COMPACTION_BASIC_ROW.name) return "compaction-basic name mismatch";
  if (findPresetRow(plugins, MAGIC_AGENT_ROW_ID) !== undefined) {
    return `row id "${MAGIC_AGENT_ROW_ID}" already present`;
  }
  if (findPresetRow(plugins, MAGIC_COMPACTION_ROW_ID) !== undefined) {
    return `row id "${MAGIC_COMPACTION_ROW_ID}" already present`;
  }
  return undefined;
}

export interface MagicPresetOptions {
  /**
   * The shipped plugin list to restate, with every field the stock row needs.
   * Read it from the installed `@deepseek-ai/dsh-web-app` preset patch.
   */
  readonly stockPlugins: readonly Record<string, unknown>[];
  /**
   * Absolute path of the Magic engine entry FILE (dist/entries/compaction.js).
   * A preset's plugins resolve from the installed packages, and the profile
   * that installs this bundle is the only place `dsh-magic-context` exists,
   * so Magic rows use absolute file URLs rather than bare specifiers.
   */
  readonly magicEngineEntry?: string;
  /**
   * Absolute path of the Magic AGENT-plane entry (dist/entries/agent.js). The
   * agent plane owns the ctx_* tools, historian, dreamer and the knowledge
   * gate; without it the plugin contributes only the host service.
   */
  readonly magicAgentEntry?: string;
}

/**
 * Build the restated preset plugin list: the stock list, verbatim and in
 * order, with `compaction-basic` disabled and the two Magic rows folded in.
 *
 * `compaction-basic` is DISABLED rather than removed (the row is kept for
 * diagnostics) because Magic replaces it with its own engine; running both
 * would double-compress. It sits inside the isolated `compaction` group, so
 * the Magic engine is inserted into the same group to share the realm.
 */
export function buildPresetPlugins(opts: MagicPresetOptions): Record<string, unknown>[] {
  const engineName =
    opts.magicEngineEntry === undefined
      ? "dsh-magic-context/compaction"
      : pathToFileURL(opts.magicEngineEntry).href;
  const agentName =
    opts.magicAgentEntry === undefined
      ? "dsh-magic-context/agent"
      : pathToFileURL(opts.magicAgentEntry).href;

  return opts.stockPlugins.map((row) => {
    const cloned = structuredClone(row) as Record<string, unknown>;
    if (cloned.id === STOCK_COMPACTION_GROUP.id && Array.isArray(cloned.config)) {
      // `compaction-basic` lives INSIDE the group, so this is where it is
      // disabled — a top-level id check would never see it. The sibling Magic
      // engine is appended to the same `config` list so both share the
      // group's isolated `compaction` realm.
      cloned.config = (cloned.config as Record<string, unknown>[]).map((child) =>
        child.id === STOCK_COMPACTION_BASIC_ROW.id ? { ...child, disabled: true } : child,
      );
      cloned.config = [
        ...(cloned.config as Record<string, unknown>[]),
        {
          id: MAGIC_COMPACTION_ROW_ID,
          name: engineName,
          config: { auto: true },
        },
      ];
      return cloned;
    }
    if (cloned.id === STOCK_COMPACTION_BASIC_ROW.id) {
      // Defensive: a future layout that hoists the row out of the group still
      // gets it disabled.
      cloned.disabled = true;
      return cloned;
    }
    return cloned;
  }).concat([
    {
      id: MAGIC_AGENT_ROW_ID,
      name: agentName,
    },
  ]);
}

/**
 * The bundle patch rows for the preset. An override carries `id` and no
 * `insert`, which targets the existing shipped row: supplied fields replace
 * the row's fields and `config` is replaced wholesale.
 */
export function buildPresetPatchEntries(opts: MagicPresetOptions): Record<string, unknown>[] {
  return [
    {
      id: STOCK_PRESET_ROW_ID,
      name: "@deepseek-ai/dsh-agent-preset",
      config: {
        id: STOCK_PRESET_CONFIG_ID,
        order: 1,
        plugins: buildPresetPlugins(opts),
      },
    },
  ];
}

/**
 * Apply the preset override over a parsed patch layer (structure-level
 * verification used by tests and doctor dry-runs). Reuses the loader's own
 * patch engine, so the dump can never drift from what boots.
 */
export function applyMagicPatches(
  entries: readonly Record<string, unknown>[],
  opts: MagicPresetOptions,
): Record<string, unknown>[] {
  const row = entries.find((entry) => entry.id === STOCK_PRESET_ROW_ID);
  if (row === undefined) {
    throw new Error(`magic-standard: preset row "${STOCK_PRESET_ROW_ID}" missing from the patch layer`);
  }
  const plugins = (row.config as { plugins?: readonly Record<string, unknown>[] } | undefined)?.plugins;
  if (plugins === undefined) {
    throw new Error(`magic-standard: preset row "${STOCK_PRESET_ROW_ID}" carries no config.plugins`);
  }
  const layoutIssue = scanStockPresetLayout(plugins);
  if (layoutIssue !== undefined) throw new Error(`magic-standard: stock preset layout ${layoutIssue}`);
  return applyEntryPatches(
    entries as unknown as Parameters<typeof applyEntryPatches>[0],
    buildPresetPatchEntries(opts) as unknown as Parameters<typeof applyEntryPatches>[1],
    () => {},
  ) as unknown as Record<string, unknown>[];
}

/** Absolute filesystem names (magicEntryPath results) become file:// URLs. */
export function toEntryName(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    name:
      typeof row.name === "string" && isAbsolute(row.name) ? pathToFileURL(row.name).href : row.name,
  };
}
