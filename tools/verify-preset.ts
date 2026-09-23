import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildPresetPatchEntries, applyMagicPatches, scanStockPresetLayout } from "../packages/dsh-plugin/src/compat/dsh-0.1/preset.ts";
import { parseEntryListYaml } from "../packages/dsh-plugin/src/doctor/setup.ts";

const shipped = parseEntryListYaml(readFileSync("tools/shipped-standard.patch.yml", "utf8"));
const stockPlugins = (shipped[0].config as any).plugins;
console.log("shipped rows:", stockPlugins.length);
console.log("scan:", scanStockPresetLayout(stockPlugins) ?? "OK");

const opts = {
  stockPlugins,
  magicEngineEntry: "C:/mc/dist/entries/compaction.js",
  magicAgentEntry: "C:/mc/dist/entries/agent.js",
};
const entries = buildPresetPatchEntries(opts);
const row = entries[0];
console.log("row id:", row.id, "| has insert:", (row as any).insert !== undefined);
const built = (row.config as any).plugins;
console.log("built rows:", built.length);
// exactly one enabled compaction provider?
const grp = built.find((r: any) => r.id === "compaction");
const enabled = grp.config.filter((c: any) => c.disabled !== true && String(c.name).includes("compaction"));
console.log("enabled compaction providers:", enabled.map((c: any) => c.id));
console.log("basic disabled:", grp.config.find((c: any) => c.id === "compaction-basic")?.disabled);
console.log("last row:", built[built.length - 1].id);
