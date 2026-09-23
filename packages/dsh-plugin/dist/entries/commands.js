import"./agent-yp89cn0d.js";
import"./agent-8w60yqpt.js";
import"./agent-nb38pbc0.js";
import {
  registerCtxCommands
} from "./agent-cbhhxyak.js";
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
