import"./agent-89gq5dda.js";
import"./agent-z992kvg4.js";
import"./agent-nb38pbc0.js";
import {
  registerCtxCommands
} from "./agent-8z9wzard.js";
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
