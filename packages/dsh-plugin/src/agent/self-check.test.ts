import { describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupTestDir, createTestDb } from "../test-utils";
import {
  formatSelfCheck,
  logAccessorOf,
  MAGIC_TOOL_NAMES,
  runSelfCheck,
  toolVisibility,
} from "./self-check";

describe("self-check: log accessor", () => {
  it("reports which accessor actually serves the log", () => {
    // The drift that killed the context plane: stubs declared `events`, the
    // runtime only had snapshotEvents().
    expect(logAccessorOf({ snapshotEvents: () => [1, 2] })).toEqual({
      accessor: "snapshotEvents",
      count: 2,
    });
    expect(logAccessorOf({ events: [1] })).toEqual({ accessor: "events", count: 1 });
    expect(logAccessorOf({})).toEqual({ accessor: "none", count: 0 });
  });
});

describe("self-check: tool catalog", () => {
  it("names the tools a scope cannot see", () => {
    const visible = new Map<string, unknown>(MAGIC_TOOL_NAMES.map((name) => [name, {}]));
    visible.delete("ctx_reduce");
    const result = toolVisibility({ view: () => ({ visible }) }, {});
    expect(result.verifiable).toBe(true);
    expect(result.missing).toEqual(["ctx_reduce"]);
  });

  it("falls back to get() when the host exposes no view()", () => {
    const result = toolVisibility(
      { get: (name: string) => (name === "ctx_note" ? undefined : {}) },
      {},
    );
    expect(result.missing).toEqual(["ctx_note"]);
  });

  it("is reported UNVERIFIABLE rather than passing silently", () => {
    expect(toolVisibility({}, {})).toMatchObject({ verifiable: false, missing: [] });
  });
});

describe("self-check: report", () => {
  it("passes a session whose log reads and whose tools are all visible", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-selfcheck-"));
    const db = await createTestDb(join(dir, "context.db"));
    try {
      const visible = new Map<string, unknown>(MAGIC_TOOL_NAMES.map((name) => [name, {}]));
      const report = runSelfCheck({
        readTools: () => ({ view: () => ({ visible }) }),
        agent: { session: { snapshotEvents: () => [{}] } },
        db,
        canonicalSessionId: "dsh:a:s1",
        surfaceNodes: 0,
      });
      expect(report.failures).toEqual([]);
      expect(formatSelfCheck(report, "dsh:a:s1")).toContain("self-check ok");
    } finally {
      await cleanupTestDir(dir, db);
    }
  });

  it("fails when the log reads empty but the surface has nodes", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-selfcheck-"));
    const db = await createTestDb(join(dir, "context.db"));
    try {
      const report = runSelfCheck({
        agent: { session: { snapshotEvents: () => [], surface: { nodes: [1] } } },
        db,
        canonicalSessionId: "dsh:a:s2",
        surfaceNodes: 1,
      });
      expect(report.failures.join(" ")).toContain("reads as empty");
      // Tagging producing nothing is the other half of the same silence.
      expect(report.failures.join(" ")).toContain("tagging is producing nothing");
      expect(formatSelfCheck(report, "dsh:a:s2")).toContain("self-check FAILED");
    } finally {
      await cleanupTestDir(dir, db);
    }
  });
});
