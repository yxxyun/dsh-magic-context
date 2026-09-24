/**
 * DSH adapter test utilities (mirrors pi-plugin test-utils).
 *
 * The shared DB must be opened AFTER the harness identity is locked: tests
 * call `setDshHarness()` exactly like the Pi suite calls `setHarness("pi")`.
 */
import { mkdtempSync } from "node:fs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initializeDatabase,
  openDatabaseAsync,
} from "@magic-context/core/features/magic-context/storage-db";
import type { Database } from "@magic-context/core/shared/sqlite";
import { setDshHarness } from "dsh-magic-context-adapter";

export type { Database };

/** Create a temp storage directory for an isolated DSH test home. */
export function createTestStorageDir(): string {
  return mkdtempSync(join(tmpdir(), "dsh-magic-test-"));
}

/**
 * Remove a test temp directory, retrying through Windows' asynchronous handle
 * release. SQLite keeps the .db-wal/.db-shm handles alive for a moment after
 * `close()`, so a bare `rmSync` intermittently fails with EBUSY — that was the
 * source of this suite's five long-standing "known failures" (nudge x2,
 * heuristic cleanup, temporal gap x2). Every cleanup in this package should call
 * this instead of `rmSync` directly.
 */
export async function cleanupTestDir(dir: string, db?: { close(): void }): Promise<void> {
  try {
    db?.close();
  } catch {
    // already closed
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  // Last resort: report it rather than failing a test on a cleanup race.
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // A leaked temp dir is preferable to a flaky suite.
  }
}

/** Open a fresh, migrated test DB (harness locked to dsh first). */
export async function createTestDb(dbPath: string): Promise<Database> {
  setDshHarness();
  const db = await openDatabaseAsync({ dbPath });
  if (db === null) throw new Error("createTestDb: openDatabaseAsync refused");
  initializeDatabase(db);
  return db;
}
