import"./agent-5gth7qh5.js";
import"./agent-c3gc6xe0.js";
import {
  registerCtxCommands
} from "./agent-kjq40qkp.js";
import"./agent-6rr0cza0.js";

// src/entries/commands.ts
var name = "magic-context-commands";
function apply(ctx, config = {}) {
  registerCtxCommands(ctx, config);
}
var commands_default = { name, apply };
export {
  apply,
  commands_default as default,
  name
};
