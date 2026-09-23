// src/compat/dsh-0.1/session.ts
import {
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage
} from "@deepseek-ai/dsh-llm";
import {
  Session,
  SessionSeq
} from "@deepseek-ai/dsh-session";
import {
  deriveEventMessage as deriveEventMessage2,
  foldSurface
} from "@deepseek-ai/dsh-session/surface";
function textBlock2(text) {
  return { type: "text", text };
}
var MAGIC_PLUGIN_PACKAGE = "dsh-magic-context";
var MAGIC_SOURCE_KIND2 = `plugin:${MAGIC_PLUGIN_PACKAGE}`;
function magicSource2(extra = {}) {
  return { kind: MAGIC_SOURCE_KIND2, ...extra };
}
function isMagicSource2(source) {
  if (source === null || typeof source !== "object")
    return false;
  const s = source;
  if (s.kind === MAGIC_SOURCE_KIND2)
    return true;
  return s.kind === "plugin" && s.plugin === "magic-context";
}
function magicUserMessage2(content, source, extraBlocks = []) {
  return createUserMessage({
    content: [textBlock2(content), ...extraBlocks],
    source
  });
}
function sessionEvents2(session) {
  const view = session;
  if (view === null || view === undefined) {
    reportSessionEventsFailure("session view is null/undefined");
    return [];
  }
  if (typeof view.snapshotEvents === "function") {
    const events = view.snapshotEvents();
    if (Array.isArray(events))
      return events;
    reportSessionEventsFailure(`snapshotEvents() returned ${typeof events}, not an array — falling back to the events property`);
  }
  if (Array.isArray(view.events))
    return view.events;
  reportSessionEventsFailure("session exposes neither snapshotEvents() nor an events array");
  return [];
}
var sessionEventsFailureReporter;
function setSessionEventsFailureReporter2(reporter) {
  sessionEventsFailureReporter = reporter;
}
function reportSessionEventsFailure(message) {
  try {
    sessionEventsFailureReporter?.(message);
  } catch {}
}
function findEventBySeq2(events, seq, onMisaligned) {
  const direct = events[seq];
  if (direct !== undefined && direct.seq === seq)
    return direct;
  const found = events.find((event) => event.seq === seq);
  if (found !== undefined && onMisaligned !== undefined) {
    try {
      onMisaligned(`events[${seq}] does not hold seq ${seq} (array length ${events.length}); recovered by scanning`);
    } catch {}
  }
  return found;
}

export { deriveEventMessage2, textBlock2, MAGIC_SOURCE_KIND2, magicSource2, isMagicSource2, magicUserMessage2, sessionEvents2, setSessionEventsFailureReporter2, findEventBySeq2 };
