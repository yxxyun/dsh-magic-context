import {
  registerCtxTools
} from "./agent-w9qgmx51.js";
import"./agent-5gth7qh5.js";
import"./agent-p7nkw8zz.js";

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
