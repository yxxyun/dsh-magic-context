import { describe, expect, it } from "bun:test";
import { pathToFileURL } from "node:url";
import {
  MAGIC_AGENT_ROW_ID,
  MAGIC_COMPACTION_ROW_ID,
  STOCK_COMPACTION_BASIC_ROW,
  STOCK_PRESET_CONFIG_ID,
  STOCK_PRESET_ROW_ID,
  applyMagicPatches,
  buildPresetPatchEntries,
  buildPresetPlugins,
  findPresetRow,
  scanStockPresetLayout,
} from "./preset";

/** Minimal stand-in for the shipped standard preset's plugin list. */
function stockPlugins(extra: Record<string, unknown>[] = []): Record<string, unknown>[] {
  return [
    { id: "persona", name: "@deepseek-ai/dsh-persona", config: { text: "x" } },
    {
      id: "compaction",
      name: "cordis:group",
      group: true,
      isolate: { compaction: true, toolResultPruner: true },
      config: [
        { id: "compaction-basic", name: "@deepseek-ai/dsh-compaction-basic" },
        { id: "command-compact", name: "@deepseek-ai/dsh-command-compact" },
        { id: "tool-result-pruner", name: "@deepseek-ai/dsh-compaction-tool-result-pruner" },
      ],
    },
    { id: "tool-ask-user", name: "@deepseek-ai/dsh-tool-ask-user" },
    ...extra,
  ];
}

/** The shipped preset patch layer: one insert carrying the declaration row. */
function stockPatchLayer(): Record<string, unknown>[] {
  return [
    {
      id: STOCK_PRESET_ROW_ID,
      name: "@deepseek-ai/dsh-agent-preset",
      config: { id: STOCK_PRESET_CONFIG_ID, order: 1, plugins: stockPlugins() },
    },
  ];
}

describe("magic standard preset override", () => {
  it("disables compaction-basic and folds the Magic engine into the group", () => {
    const plugins = buildPresetPlugins({ stockPlugins: stockPlugins() });
    const group = findPresetRow(plugins, "compaction");
    const children = group?.config as Record<string, unknown>[];
    const basic = children.find((row) => row.id === STOCK_COMPACTION_BASIC_ROW.id);
    expect(basic?.disabled).toBe(true);
    const engine = children.find((row) => row.id === MAGIC_COMPACTION_ROW_ID);
    expect(engine?.name).toBe("dsh-magic-context/compaction");
    expect((engine?.config as { auto?: boolean })?.auto).toBe(true);
    // Stock siblings untouched.
    expect(children.some((row) => row.id === "command-compact" && !row.disabled)).toBe(true);
    expect(children.some((row) => row.id === "tool-result-pruner" && !row.disabled)).toBe(true);
  });

  it("appends the Magic agent row last, outside the compaction group", () => {
    const plugins = buildPresetPlugins({ stockPlugins: stockPlugins() });
    expect(plugins[plugins.length - 1].id).toBe(MAGIC_AGENT_ROW_ID);
    expect(plugins[plugins.length - 1].name).toBe("dsh-magic-context/agent");
    // The engine must live INSIDE the group so it shares the compaction realm.
    const group = findPresetRow(plugins, "compaction");
    expect((group?.config as Record<string, unknown>[]).some((row) => row.id === MAGIC_AGENT_ROW_ID)).toBe(
      false,
    );
  });

  it("preserves the stock list verbatim and in order", () => {
    const stock = stockPlugins();
    const plugins = buildPresetPlugins({ stockPlugins: stock });
    // Everything except the Magic agent row is the stock list, same ids/order.
    expect(plugins.slice(0, stock.length).map((row) => row.id)).toEqual(stock.map((row) => row.id));
    // The input is not mutated (the patch layer is shared state).
    expect((stock[1].config as Record<string, unknown>[]).some((row) => row.id === MAGIC_COMPACTION_ROW_ID)).toBe(
      false,
    );
    expect((stock[1].config as Record<string, unknown>[])[0].disabled).toBeUndefined();
  });

  it("names absolute magics entry paths as file:// URLs", () => {
    const absoluteAgent = process.platform === "win32"
      ? "D:\\pkg\\dist\\entries\\agent.js"
      : "/pkg/dist/entries/agent.js";
    const plugins = buildPresetPlugins({
      stockPlugins: stockPlugins(),
      magicAgentEntry: absoluteAgent,
      magicEngineEntry: process.platform === "win32"
        ? "D:\\pkg\\dist\\entries\\compaction.js"
        : "/pkg/dist/entries/compaction.js",
    });
    const agent = plugins[plugins.length - 1];
    expect(agent.name).toBe(pathToFileURL(absoluteAgent).href);
    const group = findPresetRow(plugins, "compaction");
    const engine = (group?.config as Record<string, unknown>[]).find(
      (row) => row.id === MAGIC_COMPACTION_ROW_ID,
    );
    expect(String(engine?.name).startsWith("file://")).toBe(true);
  });

  it("buildPresetPatchEntries emits an override row (id, no insert)", () => {
    const rows = buildPresetPatchEntries({ stockPlugins: stockPlugins() });
    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row.id).toBe(STOCK_PRESET_ROW_ID);
    expect(row.name).toBe("@deepseek-ai/dsh-agent-preset");
    // An override must NOT carry `insert` — that would duplicate the row.
    expect(row.insert).toBeUndefined();
    const config = row.config as { id: string; order: number; plugins: Record<string, unknown>[] };
    expect(config.id).toBe(STOCK_PRESET_CONFIG_ID);
    expect(config.order).toBe(1);
    expect(config.plugins.length).toBeGreaterThan(0);
  });

  it("applyMagicPatches leaves exactly one enabled compaction provider", () => {
    const patched = applyMagicPatches(stockPatchLayer(), { stockPlugins: stockPlugins() });
    const row = patched.find((entry) => entry.id === STOCK_PRESET_ROW_ID);
    const plugins = (row?.config as { plugins: Record<string, unknown>[] }).plugins;
    const group = findPresetRow(plugins, "compaction");
    const providers = (group?.config as Record<string, unknown>[])
      .filter((child) => !child.disabled)
      .filter((child) => String(child.id).includes("compaction"));
    expect(providers.map((child) => child.id)).toEqual([MAGIC_COMPACTION_ROW_ID]);
  });

  it("contract scan rejects unknown layouts (fail closed)", () => {
    expect(scanStockPresetLayout(stockPlugins())).toBeUndefined();
    expect(scanStockPresetLayout([])).toBe("compaction group row missing");

    // Rewrite the NESTED compaction-basic row inside the group's config.
    const renamedBasic = stockPlugins().map((row) =>
      row.id === "compaction"
        ? {
            ...row,
            config: (row.config as Record<string, unknown>[]).map((child) =>
              child.id === "compaction-basic" ? { ...child, name: "some-other-package" } : child,
            ),
          }
        : row,
    );
    expect(scanStockPresetLayout(renamedBasic)).toBe("compaction-basic name mismatch");
    expect(
      scanStockPresetLayout(
        stockPlugins().map((row) =>
          row.id === "compaction" ? { ...row, isolate: { compaction: true } } : row,
        ),
      ),
    ).toBe("compaction group isolate realms mismatch");
  });

  it("contract scan refuses a list that already carries the Magic rows", () => {
    // An override must not double-insert; a re-patched list is a layout error.
    const already = stockPlugins().map((row) =>
      row.id === "compaction"
        ? {
            ...row,
            config: [
              ...(row.config as Record<string, unknown>[]),
              { id: MAGIC_COMPACTION_ROW_ID, name: "dsh-magic-context/compaction" },
            ],
          }
        : row,
    );
    expect(scanStockPresetLayout(already)).toBe(`row id "${MAGIC_COMPACTION_ROW_ID}" already present`);
    expect(scanStockPresetLayout(stockPlugins([{ id: MAGIC_AGENT_ROW_ID, name: "x" }]))).toBe(
      `row id "${MAGIC_AGENT_ROW_ID}" already present`,
    );
  });

  it("applyMagicPatches throws when the shipped override row is missing", () => {
    expect(() => applyMagicPatches([], { stockPlugins: stockPlugins() })).toThrow(
      /missing from the patch layer/,
    );
  });

  it("findPresetRow descends into nested group rows", () => {
    const plugins = stockPlugins();
    expect(findPresetRow(plugins, "compaction-basic")?.name).toBe(
      "@deepseek-ai/dsh-compaction-basic",
    );
    expect(findPresetRow(plugins, "nope")).toBeUndefined();
  });
});
