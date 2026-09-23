import {
  registerCtxTools
} from "./agent-c3gc6xe0.js";
import"./agent-5gth7qh5.js";
import"./agent-6rr0cza0.js";

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
