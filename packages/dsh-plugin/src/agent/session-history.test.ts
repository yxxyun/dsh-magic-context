import { describe, expect, it } from "bun:test";
import { historicalSessionReader, nativeDshSessionId } from "./session-history";

function fakeContext(service: unknown): never {
  return {
    get: (name: string) => (name === "sessionQuery" ? service : undefined),
  } as never;
}

describe("historical session reader (dream-path cold history)", () => {
  it("reads events from the host observation shape", async () => {
    const events = [{ seq: 1, type: "user/message" }];
    const reader = historicalSessionReader(
      fakeContext({ readSession: async () => ({ events, header: { id: "s" } }) }),
    );
    const view = await reader("sess-1");
    expect(view?.events).toBe(events);
  });

  it("accepts a live-shaped session exposing snapshotEvents()", async () => {
    const events = [{ seq: 7, type: "assistant/message" }];
    const reader = historicalSessionReader(
      fakeContext({ readSession: () => ({ snapshotEvents: () => events }) }),
    );
    expect((await reader("sess-2"))?.events).toBe(events);
  });

  // The service is optional by design: a missing service or an unknown id must
  // leave the consumers on their documented fallbacks, never fail a dream task.
  it("returns null when the service is absent", async () => {
    expect(await historicalSessionReader(fakeContext(undefined))("sess-3")).toBeNull();
    expect(await historicalSessionReader(fakeContext({}))("sess-3")).toBeNull();
  });

  it("returns null instead of throwing when readSession rejects", async () => {
    const reader = historicalSessionReader(
      fakeContext({
        readSession: () => {
          throw new Error("SESSION_QUERY_SESSION_NOT_FOUND");
        },
      }),
    );
    expect(await reader("sess-4")).toBeNull();
  });

  it("returns null for a payload that carries no event array", async () => {
    const reader = historicalSessionReader(fakeContext({ readSession: async () => ({ header: {} }) }));
    expect(await reader("sess-5")).toBeNull();
  });
});

describe("nativeDshSessionId", () => {
  it("decodes a canonical key and passes a native id through", () => {
    expect(nativeDshSessionId("dsh:a1b2c3d4:sess-9")).toBe("sess-9");
    expect(nativeDshSessionId("sess-9")).toBe("sess-9");
  });
});
