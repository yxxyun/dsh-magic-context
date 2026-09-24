import"./agent-5gth7qh5.js";
import"./agent-3yhvk2yh.js";
import {
  registerCtxCommands
} from "./agent-n5kxd04y.js";
import"./agent-p7nkw8zz.js";

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
