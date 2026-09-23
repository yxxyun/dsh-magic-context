import {
  registerCtxTools
} from "./agent-bqmbqaya.js";
import"./agent-5gth7qh5.js";
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
