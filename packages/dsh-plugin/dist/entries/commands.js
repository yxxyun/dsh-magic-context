import"./agent-5gth7qh5.js";
import"./agent-mq47ctzw.js";
import {
  registerCtxCommands
} from "./agent-dqdk0h0s.js";
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
