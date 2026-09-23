import { readFileSync } from "node:fs";
import * as yaml from "file:///C:/Users/%E6%9D%A8%E6%96%B0%E9%91%AB/.dsh/profiles/desktop/node_modules/js-yaml/dist/js-yaml.mjs";
const JsExpr = new yaml.Type("tag:yaml.org,2002:js", {
  kind: "scalar", resolve: (d) => typeof d === "string",
  construct: (d) => ({ __jsExpr: d }),
});
const schema = yaml.JSON_SCHEMA.extend(JsExpr);
for (const f of ["tools/shipped-raw.yml", "packages/dsh-plugin/cordis.patch.yml"]) {
  const t = readFileSync(f, "utf8");
  try { const r = yaml.load(t, { schema }); console.log(f, "-> OK rows:", Array.isArray(r) ? r.length : typeof r); }
  catch (e) { console.log(f, "-> FAILED:", String(e.message).split("\n")[0]); }
}
