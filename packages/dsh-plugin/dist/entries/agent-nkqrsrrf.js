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
  if (view === null || view === undefined)
    return [];
  if (typeof view.snapshotEvents === "function") {
    const events = view.snapshotEvents();
    if (Array.isArray(events))
      return events;
  }
  return Array.isArray(view.events) ? view.events : [];
}

export { deriveEventMessage2, textBlock2, MAGIC_SOURCE_KIND2, magicSource2, isMagicSource2, magicUserMessage2, sessionEvents2 };
