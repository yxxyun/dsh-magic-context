import { describe, expect, it } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { dump as yamlDump } from "js-yaml";
import { entryListSchema } from "@deepseek-ai/cordis-plugin-include";
import { Database } from "@magic-context/core/shared/sqlite";
import {
  LATEST_SUPPORTED_VERSION,
  openDatabaseAsync,
} from "@magic-context/core/features/magic-context/storage-db";
import {
  classifyDatabaseOpen,
  listProfiles,
  profileBundleFacts,
  runDshDoctor,
  scanLivenessMarkers,
} from "./doctor";
import { runDshSetup } from "./setup";
import {
  DSH_COMPAT_EXPECTED_VERSION,
  MAGIC_CONTEXT_PACKAGE,
  magicEntryPath,
} from "./env";
import {
  MAGIC_AGENT_ROW_ID,
  MAGIC_COMPACTION_ROW_ID,
  STOCK_PRESET_CONFIG_ID,
  STOCK_PRESET_ROW_ID,
} from "../compat/dsh-0.1/preset";

/**
 * The shipped standard preset rows, written as the 0.1.7 inline declaration.
 * This must list every row the bundle's own `cordis.patch.yml` restates.
 */
function stockLayout(): Record<string, unknown>[] {
  return [
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
  ];
}

/**
 * Fake dsh install carrying the shipped preset as a bundle patch — the 0.1.7
 * layout (`<webapp>/presets/standard.patch.yml`), not the pre-0.1.7
 * `config/agent-presets/<id>/agent.cordis.yml`.
 */
function fakeInstall(
  installDir: string,
  version = DSH_COMPAT_EXPECTED_VERSION,
  mutate: (rows: Record<string, unknown>[]) => Record<string, unknown>[] = (rows) => rows,
): string {
  mkdirSync(installDir, { recursive: true });
  writeFileSync(
    join(installDir, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh", version }),
  );
  const stock = join(
    installDir,
    "node_modules",
    "@deepseek-ai",
    "dsh-web-app",
    "presets",
    "standard.patch.yml",
  );
  mkdirSync(join(stock, ".."), { recursive: true });
  writeFileSync(
    stock,
    yamlDump(
      [
        {
          id: STOCK_PRESET_ROW_ID,
          name: "@deepseek-ai/dsh-agent-preset",
          config: { id: STOCK_PRESET_CONFIG_ID, order: 1, plugins: mutate(stockLayout()) },
        },
      ],
      { schema: entryListSchema },
    ),
  );
  return stock;
}

function fakeProfile(dshHome: string, name: string, bundles: string[]): void {
  const dir = join(dshHome, "profiles", name);
  mkdirSync(join(dir, "node_modules", MAGIC_CONTEXT_PACKAGE), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name, dsh: { profile: { bundles } } }),
  );
}

interface TestEnv {
  root: string;
  dshHome: string;
  installDir: string;
  configHome: string;
  work: string;
}

function makeEnv(): TestEnv {
  const root = mkdtempSync(join(tmpdir(), "dsh-magic-doctor-"));
  return {
    root,
    dshHome: join(root, "dsh-home"),
    installDir: join(root, "install"),
    configHome: join(root, "config"),
    work: join(root, "work"),
  };
}

async function cleanup(root: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

function byId(report: Awaited<ReturnType<typeof runDshDoctor>>): Map<string, Awaited<ReturnType<typeof runDshDoctor>>["checks"][number]> {
  return new Map(report.checks.map((check) => [check.id, check]));
}

describe("dsh-magic-context doctor (Phase 2 slice C)", () => {
  it("classifies a healthy shared DB open as ok", async () => {
    const env = makeEnv();
    try {
      const dbPath = join(env.root, "ok", "context.db");
      const outcome = await classifyDatabaseOpen(dbPath);
      expect(outcome.kind).toBe("ok");
      if (outcome.kind === "ok") {
        expect(outcome.schemaVersion).toBe(LATEST_SUPPORTED_VERSION);
        expect(outcome.latestSupported).toBe(LATEST_SUPPORTED_VERSION);
        outcome.db?.close();
      }
    } finally {
      await cleanup(env.root);
    }
  });

  it("classifies a newer persisted schema as a schema-fence refusal", async () => {
    const env = makeEnv();
    try {
      const dbPath = join(env.root, "fence", "context.db");
      mkdirSync(dirname(dbPath), { recursive: true });
      const db = new Database(dbPath);
      db.exec("CREATE TABLE schema_migrations (version INTEGER NOT NULL)");
      db.exec("INSERT INTO schema_migrations (version) VALUES (9999)");
      db.close();
      const outcome = await classifyDatabaseOpen(dbPath);
      expect(outcome.kind).toBe("schema-fence");
    } finally {
      await cleanup(env.root);
    }
  });

  it("scans liveness markers: own pid is live, an impossible pid is stale", async () => {
    const env = makeEnv();
    try {
      const storage = join(env.root, "storage");
      const dir = join(storage, "rpc", "a1b2c3d4");
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, `port-${process.pid}.json`),
        JSON.stringify({ port: 1, pid: process.pid, started_at: Date.now() }),
      );
      writeFileSync(
        join(dir, "port-99999999.json"),
        JSON.stringify({ port: 2, pid: 99999999, started_at: Date.now() }),
      );
      const scan = scanLivenessMarkers(storage);
      expect(scan.liveCount).toBe(1);
      expect(scan.markers.find((marker) => marker.pid === process.pid)?.live).toBe(true);
      expect(scan.markers.find((marker) => marker.pid === 99999999)?.live).toBe(false);
    } finally {
      await cleanup(env.root);
    }
  });

  it("reads profile bundle facts from a fake profile", async () => {
    const env = makeEnv();
    try {
      fakeProfile(env.dshHome, "web", ["@deepseek-ai/dsh-base", MAGIC_CONTEXT_PACKAGE]);
      fakeProfile(env.dshHome, "headless", ["@deepseek-ai/dsh-base"]);
      expect(listProfiles(env.dshHome).sort()).toEqual(["headless", "web"]);
      const web = profileBundleFacts(env.dshHome, "web");
      expect(web.bundleInstalled).toBe(true);
      expect(web.nodeModulesPackageExists).toBe(true);
      const headless = profileBundleFacts(env.dshHome, "headless");
      expect(headless.bundleInstalled).toBe(false);
    } finally {
      await cleanup(env.root);
    }
  });

  it("reports ok across the full checklist on a clean environment", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      fakeInstall(env.installDir);
      fakeProfile(env.dshHome, "web", [MAGIC_CONTEXT_PACKAGE]);
      const setup = await runDshSetup([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
      });
      expect(setup.exitCode).toBe(0);
      // Pre-create the shared DB so the shared-db check classifies ok. The
      // core caches handles by path: keep this handle open (do NOT close it)
      // or the doctor's reopen would see a closed cached handle; the doctor
      // itself closes the handle after classifying.
      const dbPath = join(env.root, "storage", "context.db");
      const pre = await openDatabaseAsync({ dbPath });
      expect(pre).not.toBeNull();

      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        storageDirOverride: join(env.root, "storage"),
        dbPathOverride: dbPath,
      });
      expect(report.exitCode).toBe(0);
      const checks = byId(report);
      expect(checks.get("dsh-version")?.status).toBe("ok");
      expect(checks.get("bundle-install.web")?.status).toBe("ok");
      expect(checks.get("preset-override")?.status).toBe("ok");
      expect(checks.get("shared-db")?.status).toBe("ok");
      expect(checks.get("liveness-markers")?.status).toBe("ok");
      expect(checks.get("config-load")?.status).toBe("ok");
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the version check on a different release line", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      fakeInstall(env.installDir, "0.1.0-rc.5");
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
      });
      const version = byId(report).get("dsh-version");
      expect(version?.status).toBe("fail");
      expect(version?.detail).toContain("0.1.0-rc.5");
      expect(report.exitCode).toBe(1);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the bundle check when the package is missing from a profile", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      fakeInstall(env.installDir);
      fakeProfile(env.dshHome, "web", ["@deepseek-ai/dsh-base"]);
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        profile: "web",
      });
      const bundle = byId(report).get("bundle-install.web");
      expect(bundle?.status).toBe("fail");
      expect(bundle?.fix).toContain("dsh.profile.bundles");
      expect(report.exitCode).toBe(1);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the preset check when the shipped patch cannot be found", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      // An install root with no shipped preset patch under it.
      mkdirSync(env.installDir, { recursive: true });
      writeFileSync(
        join(env.installDir, "package.json"),
        JSON.stringify({ name: "@deepseek-ai/dsh", version: DSH_COMPAT_EXPECTED_VERSION }),
      );
      fakeProfile(env.dshHome, "web", [MAGIC_CONTEXT_PACKAGE]);
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        profile: "web",
      });
      const preset = byId(report).get("preset-override");
      expect(preset?.status).toBe("fail");
      // No file-backed preset is generated any more, and nothing expects one.
      expect(existsSync(join(env.dshHome, ".agent-presets", "magic-standard"))).toBe(false);
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the preset check when the shipped list drifts from the override", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      // Drop a row the bundle's own patch still restates: an upgrade that
      // renamed or removed a shipped row must be caught before it ships.
      fakeInstall(env.installDir, DSH_COMPAT_EXPECTED_VERSION, (rows) =>
        rows.filter((row) => row.id !== "tool-web"),
      );
      fakeProfile(env.dshHome, "web", [MAGIC_CONTEXT_PACKAGE]);
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        profile: "web",
      });
      const preset = byId(report).get("preset-override");
      expect(preset?.status).toBe("fail");
      expect(preset?.detail).toContain("tool-web");
      expect(preset?.detail).toContain("regenerate cordis.patch.yml");
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the preset check when the shipped list still enables compaction-basic", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      // A shipped patch that itself pre-disables the row would make the
      // bundle's own `disabled: true` a no-op — worth flagging so the
      // override is re-derived rather than assumed.
      fakeInstall(env.installDir, DSH_COMPAT_EXPECTED_VERSION, (rows) =>
        rows.map((row) => (row.id === "compaction" ? { ...row, isolate: {} } : row)),
      );
      fakeProfile(env.dshHome, "web", [MAGIC_CONTEXT_PACKAGE]);
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        profile: "web",
      });
      const preset = byId(report).get("preset-override");
      expect(preset).toBeDefined();
      expect(preset?.status).toBe("ok");
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });

  it("fails the shared-db check on a schema-fence DB", async () => {
    const env = makeEnv();
    process.env.XDG_CONFIG_HOME = env.configHome;
    try {
      fakeInstall(env.installDir);
      fakeProfile(env.dshHome, "web", [MAGIC_CONTEXT_PACKAGE]);
      const dbPath = join(env.root, "storage", "context.db");
      mkdirSync(dirname(dbPath), { recursive: true });
      const db = new Database(dbPath);
      db.exec("CREATE TABLE schema_migrations (version INTEGER NOT NULL)");
      db.exec("INSERT INTO schema_migrations (version) VALUES (9999)");
      db.close();
      const report = await runDshDoctor([], {
        dshHome: env.dshHome,
        dshInstallDir: env.installDir,
        directory: env.work,
        storageDirOverride: join(env.root, "storage"),
        dbPathOverride: dbPath,
        profile: "web",
      });
      const sharedDb = byId(report).get("shared-db");
      expect(sharedDb?.status).toBe("fail");
      expect(sharedDb?.detail).toContain("schema fence");
    } finally {
      delete process.env.XDG_CONFIG_HOME;
      await cleanup(env.root);
    }
  });
});
