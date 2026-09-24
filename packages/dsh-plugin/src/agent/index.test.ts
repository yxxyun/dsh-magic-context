/**
 * Agent-plane entry tests: the top-level kill switch and the config bridge.
 *
 * `bridgeMagicConfig` had NO test at all, which is how three config keys drifted
 * silently (the top-level `enabled` switch was never read, so `enabled: false`
 * could not turn the plane off). These tests pin the file-driven path, not just
 * the object-in/object-out path, so a dropped bridge line fails here.
 */
import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Context } from "@deepseek-ai/cordis";
import { apply, bridgeMagicConfig } from "./index";

function withProjectConfig(
  configText: string | null,
  run: (directory: string) => void,
): void {
  const root = mkdtempSync(join(tmpdir(), "dsh-agent-cfg-"));
  const xdg = join(root, "xdg");
  mkdirSync(xdg, { recursive: true });
  const previousXdg = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = xdg;
  const directory = join(root, "project");
  mkdirSync(join(directory, ".cortexkit"), { recursive: true });
  if (configText !== null) {
    writeFileSync(join(directory, ".cortexkit", "magic-context.jsonc"), configText, "utf-8");
  }
  try {
    run(directory);
  } finally {
    if (previousXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = previousXdg;
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * The project tier cannot carry every key: `language` is stripped there on
 * purpose (project-security.ts:433-436 — "a repo must not inject prompt text
 * through a user preference"), so the language mapping has to be exercised
 * through the user tier.
 */
function withUserConfig(configText: string, run: (directory: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "dsh-agent-usercfg-"));
  const xdg = join(root, "xdg");
  mkdirSync(join(xdg, "cortexkit"), { recursive: true });
  const previousXdg = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = xdg;
  writeFileSync(join(xdg, "cortexkit", "magic-context.jsonc"), configText, "utf-8");
  const directory = join(root, "project");
  mkdirSync(directory, { recursive: true });
  try {
    run(directory);
  } finally {
    if (previousXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = previousXdg;
    rmSync(root, { recursive: true, force: true });
  }
}

/** A ctx with no host service — the guard must not need one to short-circuit. */
function makeBareCtx(): Context {
  return {
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    get: () => undefined,
  } as unknown as Context;
}

describe("magic-context agent plane: bridge mappings", () => {
  it("bridges language into the guidance config consumers read", () => {
    withUserConfig('{"language": "zh"}', (directory) => {
      expect(bridgeMagicConfig({}, directory).guidance?.language).toBe("zh");
    });
  });

  it("bridges protected_tokens into the tool and context planes", () => {
    withProjectConfig('{"protected_tokens": 24000}', (directory) => {
      const bridged = bridgeMagicConfig({}, directory);
      expect(bridged.tools?.protectedTokens).toBe(24_000);
      expect(bridged.context?.protectedTokens).toBe(24_000);
    });
  });

  it("bridges mural so compress-cues and the image block can run", () => {
    withUserConfig('{"mural": {"enabled": true}}', (directory) => {
      const bridged = bridgeMagicConfig({}, directory);
      expect(bridged.mural?.enabled).toBe(true);
      expect(bridged.knowledge?.muralEnabled).toBe(true);
    });
  });

  it("leaves protected_tokens undefined when the user set none", () => {
    withProjectConfig('{"enabled": true}', (directory) => {
      expect(bridgeMagicConfig({}, directory).tools?.protectedTokens).toBeUndefined();
    });
  });
});

describe("magic-context agent plane: enabled switch", () => {
  it("bridges enabled=false from the project config file", () => {
    withProjectConfig('{"enabled": false}', (directory) => {
      expect(bridgeMagicConfig({}, directory).enabled).toBe(false);
    });
  });

  it("treats an absent or true enabled as enabled", () => {
    withProjectConfig('{"enabled": true}', (directory) => {
      expect(bridgeMagicConfig({}, directory).enabled).toBe(true);
    });
    withProjectConfig(null, (directory) => {
      expect(bridgeMagicConfig({}, directory).enabled).not.toBe(false);
    });
  });

  it("lets the row-level config win over the shared file", () => {
    withProjectConfig('{"enabled": true}', (directory) => {
      expect(bridgeMagicConfig({ enabled: false }, directory).enabled).toBe(false);
    });
  });

  it("short-circuits apply() before the host requirement when disabled", () => {
    withProjectConfig('{"enabled": false}', (directory) => {
      // The guard sits before readMagicContextHost(), so a deliberately disabled
      // plane can never fail the boot. Without the guard this throws
      // "magicContextHost service unavailable".
      expect(() => apply(makeBareCtx(), { directory })).not.toThrow();
    });
  });

  it("still requires the host service when enabled", () => {
    withProjectConfig('{"enabled": true}', (directory) => {
      expect(() => apply(makeBareCtx(), { directory })).toThrow(/magicContextHost/);
    });
  });
});
