import {
  registerCtxTools
} from "./agent-89gq5dda.js";
import"./agent-z992kvg4.js";
import"./agent-nb38pbc0.js";
import"./agent-nkqrsrrf.js";

// src/entries/tools.ts
var name = "magic-context-tools";
function apply(ctx, config = {}) {
  registerCtxTools(ctx, config);
}
var tools_default = { name, apply };
export {
  apply,
  tools_default as default,
  name
};
