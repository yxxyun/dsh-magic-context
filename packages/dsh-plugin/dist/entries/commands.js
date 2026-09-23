import"./agent-5gth7qh5.js";
import"./agent-bqmbqaya.js";
import {
  registerCtxCommands
} from "./agent-98m64s99.js";
import"./agent-nkqrsrrf.js";

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
