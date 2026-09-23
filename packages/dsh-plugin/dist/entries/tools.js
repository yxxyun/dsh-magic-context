import {
  registerCtxTools
} from "./agent-yp89cn0d.js";
import"./agent-8w60yqpt.js";
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
