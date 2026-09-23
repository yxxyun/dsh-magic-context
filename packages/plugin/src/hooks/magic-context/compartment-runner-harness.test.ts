import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Static guards for `harness` attribution in the shared SQLite `harness` column.
//
// The bug: several write paths hardcoded `harness: "opencode"` instead of
// reading the boot-time harness identity. Harness is a constant per plugin
// instance — the DSH agent plane locks it via setDshHarness() before any DB
// write, and each plane inlines its own copy of the core's harness module — so
// a literal silently misattributes every row the DSH port writes.
//
// Observed live before the fix: historian_runs and subagent_invocations each
// carried dsh rows stamped harness='opencode' while compartments, tags and
// session_projects were correctly stamped 'dsh'. The dreamer is scheduled every
// 15 minutes and writes subagent_invocations through these same sites, so the
// drift would have kept spreading.
//
// Sites that legitimately name a harness are the harness-SPECIFIC writers the
// DSH port never calls — packages/plugin/src/index.ts, plugin/tool-registry.ts
// (the OpenCode plugin entry) and transform-decision-log.ts (separate OpenCode
// and Pi writers). Those are excluded by scanning only the two call shapes
// below, not by file allowlisting.

const CORE_SRC = join(import.meta.dir, "..", "..");

function productionSources(dir: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            found.push(...productionSources(full));
        } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
            found.push(full);
        }
    }
    return found;
}

/** Every `name({ ... })` / `name(db, { ... })` call body in `src`. */
function callBodies(src: string, name: string): string[] {
    return src.match(new RegExp(`${name}\\((?:[^()]*,\\s*)?\\{[\\s\\S]*?\\n\\s*\\}\\)`, "g")) ?? [];
}

const incrementalPath = join(import.meta.dir, "compartment-runner-incremental.ts");
const recompPath = join(import.meta.dir, "compartment-runner-recomp.ts");

test("every recordHistorianRun call site reads harness from getHarness()", () => {
    const sources = [
        ["incremental", readFileSync(incrementalPath, "utf8")],
        ["recomp", readFileSync(recompPath, "utf8")],
    ] as const;
    for (const [name, src] of sources) {
        const calls = callBodies(src, "recordHistorianRun");
        expect(calls.length).toBeGreaterThan(0);
        for (const call of calls) {
            expect(`${name}: ${call}`).toContain("harness: getHarness()");
        }
    }
});

test("every recordChildInvocation call site reads harness from getHarness()", () => {
    let total = 0;
    for (const file of productionSources(CORE_SRC)) {
        const src = readFileSync(file, "utf8");
        for (const call of callBodies(src, "recordChildInvocation")) {
            total += 1;
            expect(`${file}: ${call}`).toContain("harness: getHarness()");
        }
    }
    // Guards against the scan silently matching nothing.
    expect(total).toBeGreaterThanOrEqual(11);
});

test("no harness-attributing call site hardcodes a harness string literal", () => {
    for (const file of productionSources(CORE_SRC)) {
        const src = readFileSync(file, "utf8");
        for (const name of ["recordHistorianRun", "recordChildInvocation", "insertPrimerCandidates"]) {
            for (const call of callBodies(src, name)) {
                // A literal would silently misattribute every row that path writes.
                expect(`${file} ${name}: ${call}`).not.toMatch(/harness:\s*["'`]/);
            }
        }
    }
});

test("both runners import getHarness from the shared harness module", () => {
    for (const [name, path] of [
        ["incremental", incrementalPath],
        ["recomp", recompPath],
    ] as const) {
        expect(`${name}: ${readFileSync(path, "utf8").includes("shared/harness")}`).toBe(`${name}: true`);
    }
});
