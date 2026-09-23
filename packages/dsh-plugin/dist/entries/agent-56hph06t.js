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
export { createUserMessage2, deriveEventMessage2, textBlock2, magicUserMessage2 };
