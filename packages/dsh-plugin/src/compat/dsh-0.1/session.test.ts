import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { findEventBySeq, sessionEvents, setSessionEventsFailureReporter } from "./session";

/** Minimal event shape; the accessor only ever reads `seq`. */
interface AnyEvent {
  seq: number;
  type: string;
}

const ev = (seq: number): AnyEvent => ({ seq, type: "user/message" });

let reported: string[] = [];

beforeEach(() => {
  reported = [];
  setSessionEventsFailureReporter((message) => reported.push(message));
});

afterEach(() => {
  setSessionEventsFailureReporter(undefined);
});

describe("sessionEvents (host log accessor)", () => {
  it("prefers snapshotEvents() and reports nothing", () => {
    const events = [ev(0), ev(1)];
    expect(sessionEvents({ snapshotEvents: () => events })).toBe(events as never);
    expect(reported).toEqual([]);
  });

  it("returns an `events` array WITHOUT reporting when snapshotEvents is absent", () => {
    // This shape is the port's OWN transcript view — the `{events, surface, header}`
    // literal built in context-plane.ts / historian-wiring.ts — and the test fakes.
    // Treating it as a degradation produced a per-step false alarm that read exactly
    // like a broken host API, which is worse than no signal at all.
    const events = [ev(0)];
    expect(sessionEvents({ events })).toBe(events as never);
    expect(reported).toEqual([]);
  });

  it("reports a non-array from snapshotEvents() but still falls back to `events`", () => {
    const events = [ev(0)];
    expect(sessionEvents({ snapshotEvents: () => undefined, events })).toBe(events as never);
    expect(reported.length).toBe(1);
    expect(reported[0]).toContain("snapshotEvents() returned");
  });

  it("reports and returns [] when the log is genuinely unreadable", () => {
    // The #403 regression shape: a session object with neither member.
    expect(sessionEvents({})).toEqual([]);
    expect(reported.length).toBe(1);
    expect(reported[0]).toContain("neither snapshotEvents() nor an events array");
  });

  it("reports a null or undefined session view", () => {
    expect(sessionEvents(null)).toEqual([]);
    expect(sessionEvents(undefined)).toEqual([]);
    expect(reported.length).toBe(2);
  });

  it("survives a throwing reporter", () => {
    setSessionEventsFailureReporter(() => {
      throw new Error("reporter exploded");
    });
    expect(sessionEvents({})).toEqual([]);
  });
});

describe("findEventBySeq (alignment-tolerant lookup)", () => {
  it("uses the array index when it really holds that seq, and stays quiet", () => {
    const events = [ev(0), ev(1), ev(2)];
    const notes: string[] = [];
    const found = findEventBySeq(events as never, 2, (detail) => notes.push(detail)) as
      | AnyEvent
      | undefined;
    expect(found).toBe(events[2] as never);
    expect(notes).toEqual([]);
  });

  it("recovers by scanning when the index does not hold that seq, and reports it", () => {
    // A windowed or sparse array: events[2] is not seq 2. Reading it by index would
    // silently answer "no such event", which is how the duplicate-id guard once
    // concluded a message that WAS on the surface was not.
    const events = [ev(7), ev(8), ev(9)];
    const notes: string[] = [];
    const found = findEventBySeq(events as never, 8, (detail) => notes.push(detail)) as
      | AnyEvent
      | undefined;
    expect(found?.seq).toBe(8);
    expect(notes.length).toBe(1);
    expect(notes[0]).toContain("recovered by scanning");
  });

  it("returns undefined for a seq that is not present", () => {
    expect(findEventBySeq([ev(0), ev(1)] as never, 99)).toBeUndefined();
  });
});
