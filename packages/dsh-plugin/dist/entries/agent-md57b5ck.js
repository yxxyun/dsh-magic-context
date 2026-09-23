// src/compat/dsh-0.1/session.ts
import {
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage as createUserMessage2
} from "@deepseek-ai/dsh-llm";
import {
  Session
} from "@deepseek-ai/dsh-session";
import {
  deriveEventMessage as deriveEventMessage2,
  foldSurface
} from "@deepseek-ai/dsh-session/surface";
function textBlock2(text) {
  return { type: "text", text };
}
function magicUserMessage2(content, source, extraBlocks = []) {
  return createUserMessage2({
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

export { createUserMessage2, deriveEventMessage2, textBlock2, magicUserMessage2, sessionEvents2 };
