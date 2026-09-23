import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { dump as yamlDump } from "js-yaml";
import { entryListSchema } from "@deepseek-ai/cordis-plugin-include";
import { parseJsonc } from "@magic-context/core/shared/jsonc-parser";
import {
  runDshSetup,
  parseEntryListYaml,
  readPresetDeclaration,
  RECOMMENDED_CONFIG_KEYS,
} from "./setup";
import {
  MAGIC_AGENT_ROW_ID,
  MAGIC_COMPACTION_ROW_ID,
  STOCK_PRESET_CONFIG_ID,
  STOCK_PRESET_ROW_ID,
} from "../compat/dsh-0.1/preset";
import { DSH_COMPAT_EXPECTED_VERSION, legacyMagicStandardDir, magicEntryPath } from "./env";

/**
 * Stand-in for the shipped standard preset plugin list. It must carry every
 * row id that this bundle's own override restates, because setup cross-checks
 * the two lists — a trimmed stub would report the bundle as inventing rows.
 */
function stockPlugins(overrides: (rows: Record<string, unknown>[]) => Record<string, unknown>[] = (rows) => rows): Record<string, unknown>[] {
  return overrides([
    { id: "persona", name: "@deepseek-ai/dsh-persona", config: { prefix: "p", suffix: "s" } },
    { id: "agent-instructions", name: "@deepseek-ai/dsh-agent-instructions" },
    { id: "tool-bash", name: "@deepseek-ai/dsh-tool-bash" },
    { id: "tool-pwsh", name: "@deepseek-ai/dsh-tool-pwsh" },
    { id: "tool-fs", name: "@deepseek-ai/dsh-tool-fs" },
    { id: "tool-fs-search", name: "@deepseek-ai/dsh-tool-fs-search" },
    { id: "tool-jobs", name: "@deepseek-ai/dsh-tool-jobs" },
    { id: "skill-filesystem", name: "@deepseek-ai/dsh-skill-filesystem" },
    { id: "tool-skill", name: "@deepseek-ai/dsh-tool-skill" },
    { id: "command-goal", name: "@deepseek-ai/dsh-command-goal" },
    { id: "tool-goal", name: "@deepseek-ai/dsh-tool-goal" },
    { id: "planning", name: "cordis:group", group: true, config: [{ id: "plan-mode", name: "@deepseek-ai/dsh-plan-mode" }] },
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
    { id: "delegation", name: "cordis:group", group: true, config: [
      { id: "tool-subagent-control", name: "@deepseek-ai/dsh-tool-subagent-control" },
      { id: "tool-subagent", name: "@deepseek-ai/dsh-tool-subagent" },
      { id: "tool-subagent-fork", name: "@deepseek-ai/dsh-tool-subagent-fork" },
      { id: "workflow-ptc", name: "@deepseek-ai/dsh-workflow-ptc" },
      { id: "tool-workflow", name: "@deepseek-ai/dsh-tool-workflow" },
    ]},
    { id: "tool-ask-user", name: "@deepseek-ai/dsh-tool-ask-user" },
    { id: "tool-todo", name: "@deepseek-ai/dsh-tool-todo" },
    { id: "tool-web", name: "@deepseek-ai/dsh-tool-web" },
    { id: "present", name: "@deepseek-ai/dsh-present" },
    { id: "tool-plugin-manager", name: "@deepseek-ai/dsh-tool-plugin-manager" },
  ]);
}

/**
 * Write a fake DSH install whose `@deepseek-ai/dsh-web-app` bundle carries the
 * shipped `presets/standard.patch.yml` declaration — the 0.1.7 layout.
 */
function writeStockInstall(
  installDir: string,
  overrides: (rows: Record<string, unknown>[]) => Record<string, unknown>[] = (rows) => rows,
  version = DSH_COMPAT_EXPECTED_VERSION,
): string {
  mkdirSync(installDir, { recursive: true });
  writeFileSync(
    join(installDir, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh", version }),
  );
  const file = join(
    installDir,
    "node_modules",
    "@deepseek-ai",
    "dsh-web-app",
    "presets",
    "standard.patch.yml",
  );
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    yamlDump(
      [
        {
          id: STOCK_PRESET_ROW_ID,
          name: "@deepseek-ai/dsh-agent-preset",
          config: { id: STOCK_PRESET_CONFIG_ID, order: 1, plugins: stockPlugins(overrides) },
        },
      ],
      { schema: entryListSchema },
    ),
  );
  return file;
}

interface TestEnv {
  root: string;
  dshHome: string;
  installDir: string;
  configHome: string;
}

function makeEnv(): TestEnv {
  const root = mkdtempSync(join(tmpdir(), "dsh-magic-setup-"));
  return {
    root,
    dshHome: join(root, "dsh-home"),
    installDir: join(root, "install"),
    configHome: join(root, "config"),
  };
}

async function cleanup(root: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

describe("dsh-magic-context setup (0.1.7 inline-preset form)", () => {
  it("verifies the shipped layout and this bundle's own override, then seeds the config", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      const stock = writeStockInstall(env.installDir);
      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(report.exitCode).toBe(0);
      expect(report.steps.every((step) => step.status !== "fail")).toBe(true);

      const scan = report.steps.find((step) => step.title.includes("contract scan"));
      expect(scan?.status).toBe("ok");
      expect(scan?.detail).toContain(stock);

      // The bundle's own override is checked against the shipped list.
      const override = report.steps.find((step) => step.title.includes("Bundle preset override"));
      expect(override?.status).toBe("ok");
      expect(override?.detail).toContain(MAGIC_AGENT_ROW_ID);
      expect(override?.detail).toContain(MAGIC_COMPACTION_ROW_ID);

      // Setup no longer GENERATES a preset: nothing preset-shaped is written.
      const legacy = legacyMagicStandardDir(env.dshHome);
      expect(existsSync(legacy)).toBe(false);
      expect(report.generatedFiles.some((file) => file.includes(".agent-presets"))).toBe(false);

      // The user config is the only artifact it creates.
      const configPath = join(env.configHome, "cortexkit", "magic-context.jsonc");
      expect(report.generatedFiles).toContain(configPath);
      expect(existsSync(configPath)).toBe(true);
      const parsed = parseJsonc<{ enabled?: boolean }>(readFileSync(configPath, "utf8"));
      expect(parsed.enabled).toBe(true);

      // Next steps point at the profile bundle list, not a `dsh plugin` call.
      expect(report.nextSteps.some((line) => line.includes("dsh.profile.bundles"))).toBe(true);
      expect(report.nextSteps.some((line) => line.includes(STOCK_PRESET_CONFIG_ID))).toBe(true);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails closed on a shipped layout mismatch and writes nothing", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      writeStockInstall(env.installDir, (rows) =>
        rows.map((row) =>
          row.id === "compaction"
            ? {
                ...row,
                config: (row.config as Record<string, unknown>[]).map((child) =>
                  child.id === "compaction-basic"
                    ? { ...child, name: "some-other-package" }
                    : child,
                ),
              }
            : row,
        ),
      );
      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(report.exitCode).toBe(1);
      expect(report.generatedFiles).toEqual([]);
      const scan = report.steps.find((step) => step.title.includes("contract scan"));
      expect(scan?.status).toBe("fail");
      // Fail closed: the user config is not created either.
      expect(existsSync(join(env.configHome, "cortexkit", "magic-context.jsonc"))).toBe(false);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("removes a stale pre-0.1.7 preset directory", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      writeStockInstall(env.installDir);
      const legacy = legacyMagicStandardDir(env.dshHome);
      mkdirSync(legacy, { recursive: true });
      writeFileSync(join(legacy, "agent.cordis.yml"), "[]\n", "utf8");
      writeFileSync(join(legacy, "preset.yml"), "name: Magic Context standard\norder: 10\n", "utf8");

      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(report.exitCode).toBe(0);
      expect(existsSync(legacy)).toBe(false);
      const step = report.steps.find((s) => s.title.includes("Legacy preset directory"));
      expect(step?.status).toBe("ok");
      expect(step?.detail).toContain("removed stale");
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("never overwrites an existing user config and hints about missing keys", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      writeStockInstall(env.installDir);
      const configPath = join(env.configHome, "cortexkit", "magic-context.jsonc");
      mkdirSync(dirname(configPath), { recursive: true });
      writeFileSync(configPath, '{\n  "enabled": false,\n  "custom": 1\n}\n', "utf8");

      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(report.exitCode).toBe(0);
      const content = readFileSync(configPath, "utf8");
      expect(content).toContain('"custom": 1');
      expect(report.generatedFiles).not.toContain(configPath);

      const configStep = report.steps.find((step) => step.title.includes("user config"));
      expect(configStep?.status).toBe("warn");
      const missing = RECOMMENDED_CONFIG_KEYS.filter((key) => key !== "enabled");
      expect(configStep?.detail).toContain(missing[0]);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("writes nothing on --dry-run", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      writeStockInstall(env.installDir);
      const report = await runDshSetup(["--dry-run"], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(report.exitCode).toBe(0);
      expect(report.generatedFiles).toEqual([]);
      expect(existsSync(join(env.configHome, "cortexkit", "magic-context.jsonc"))).toBe(false);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("reports a diagnosis when the DSH install cannot be found", async () => {
    const env = makeEnv();
    try {
      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: join(env.root, "missing-install"),
        // 遮蔽 PATH：避免实现回退到本机真实 dsh 安装（环境敏感）
        env: { ...process.env, PATH: "/nonexistent-path" },
      });
      expect(report.exitCode).toBe(1);
      const installStep = report.steps.find((step) => step.title.includes("DSH install"));
      expect(installStep?.status).toBe("fail");
      expect(installStep?.detail).toContain("Probed");
    } finally {
      await cleanup(env.root);
    }
  });

  it("warns (not fails) on a DSH release line it was not written for", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      writeStockInstall(env.installDir, (rows) => rows, "0.2.0");
      const report = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      const versionStep = report.steps.find((step) => step.title === "DSH version");
      expect(versionStep?.status).toBe("warn");
      expect(versionStep?.detail).toContain(DSH_COMPAT_EXPECTED_VERSION);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });
});

describe("readPresetDeclaration", () => {
  it("reads an inline declaration and checks the preset identity", () => {
    const patch = [
      {
        id: STOCK_PRESET_ROW_ID,
        name: "@deepseek-ai/dsh-agent-preset",
        config: { id: STOCK_PRESET_CONFIG_ID, plugins: [{ id: "persona" }] },
      },
    ];
    const declared = readPresetDeclaration(patch, STOCK_PRESET_ROW_ID);
    expect(typeof declared).not.toBe("string");
    expect((declared as { plugins: unknown[] }).plugins).toHaveLength(1);
  });

  it("returns a reason string for every malformed shape", () => {
    expect(readPresetDeclaration([], STOCK_PRESET_ROW_ID)).toContain("declares no row");
    expect(
      readPresetDeclaration([{ id: STOCK_PRESET_ROW_ID }], STOCK_PRESET_ROW_ID),
    ).toContain("carries no config");
    expect(
      readPresetDeclaration(
        [{ id: STOCK_PRESET_ROW_ID, config: { id: "other", plugins: [] } }],
        STOCK_PRESET_ROW_ID,
      ),
    ).toContain('expected "standard"');
    expect(
      readPresetDeclaration(
        [{ id: STOCK_PRESET_ROW_ID, config: { id: STOCK_PRESET_CONFIG_ID } }],
        STOCK_PRESET_ROW_ID,
      ),
    ).toContain("no config.plugins list");
  });
});

describe("shipped patch is the real one", () => {
  it("this bundle's cordis.patch.yml parses and declares the override", async () => {
    const own = parseEntryListYaml(
      readFileSync(new URL("../../cordis.patch.yml", import.meta.url), "utf8"),
    );
    const declared = readPresetDeclaration(own, STOCK_PRESET_ROW_ID);
    expect(typeof declared).not.toBe("string");
    // The row must NOT carry `insert`: that would duplicate, not override.
    const row = own.find((entry) => entry.id === STOCK_PRESET_ROW_ID);
    expect(row?.insert).toBeUndefined();
    // And the agent entry it names must exist on disk.
    expect(magicEntryPath("agent").endsWith("agent.js")).toBe(true);
  });
});
