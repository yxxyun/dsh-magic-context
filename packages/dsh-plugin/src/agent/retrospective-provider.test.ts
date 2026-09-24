import { describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestDb } from "../test-utils";
import { capSinceRows, createDshRetrospectiveProvider, genuineUserText, toolRows } from "./retrospective-provider";

describe("retrospective mapping (privacy contract)", () => {
  it("emits genuine user text only", () => {
    expect(
      genuineUserText({ role: "user", parts: [{ type: "text", text: "  fix the build  " }] }),
    ).toBe("fix the build");
    // Assistant text can carry other sessions' file contents: never emitted.
    expect(genuineUserText({ role: "assistant", parts: [{ type: "text", text: "secret" }] })).toBe("");
    // Magic-injected baselines are our own text, not user speech.
    expect(
      genuineUserText({
        role: "user",
        parts: [{ type: "text", text: "<user-profile>", synthetic: true }],
      }),
    ).toBe("");
    expect(
      genuineUserText({
        role: "user",
        parts: [{ type: "text", text: "injected", source: { kind: "plugin" } }],
      }),
    ).toBe("");
  });

  it("emits one metadata-only row per tool CALL, never output text", () => {
    const rows = toolRows(
      [
        { parts: [{ type: "tool", tool: "pwsh", callID: "c1", state: { input: { cmd: "x" } } }] },
        { parts: [{ type: "tool", tool: "pwsh", callID: "c1", state: { output: "boom: traceback" } }] },
      ],
      3,
      1_700_000_000_000,
      "dsh:a:s1",
    );
    expect(rows).toHaveLength(1); // call + result share a callID → one row
    expect(rows[0]).toMatchObject({ role: "tool", toolName: "pwsh", isError: true, text: "" });
  });

  it("reports isError from the result text and false when it is clean", () => {
    const clean = toolRows(
      [{ parts: [{ type: "tool", tool: "read", callID: "c2", state: { output: "ok" } }] }],
      1,
      1,
      "s",
    );
    expect(clean[0]?.isError).toBe(false);
  });

  it("reports the exact over-cap truncation signal", () => {
    const rows = [1, 2, 3].map((n) => ({
      sessionId: "s",
      ordinal: n,
      role: "user" as const,
      text: `m${n}`,
      ts: n,
    }));
    expect(capSinceRows(rows, 3)).toMatchObject({ truncated: false });
    expect(capSinceRows(rows, 2).messages).toHaveLength(2);
    expect(capSinceRows(rows, 2).truncated).toBe(true);
  });
});

describe("retrospective provider (session enumeration)", () => {
  it("lists only this harness's project sessions, oldest first", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-retro-"));
    const db = await createTestDb(join(dir, "context.db"));
    try {
      const insert = db.prepare(
        `INSERT INTO session_projects (session_id, project_path, harness, updated_at)
         VALUES (?, ?, ?, ?)`,
      );
      insert.run("dsh:a:newer", "/proj", "dsh", 2000);
      insert.run("dsh:a:older", "/proj", "dsh", 1000);
      insert.run("ses_opencode", "/proj", "opencode", 1500);
      insert.run("dsh:a:other", "/other", "dsh", 500);

      const provider = createDshRetrospectiveProvider({
        db,
        readHistory: async () => null,
      });
      expect(provider.listProjectSessions("/proj").map((s) => s.sessionId)).toEqual([
        "dsh:a:older",
        "dsh:a:newer",
      ]);
      expect(provider.listProjectSessions("/missing")).toEqual([]);
    } finally {
      db.close();
    }
  });
});
