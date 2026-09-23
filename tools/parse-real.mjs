// Parse the correctly-extracted shipped patches with the exact schema the
// loader uses (js-yaml JSON_SCHEMA + !!js type), and report row structure.
import { readFileSync } from "node:fs";
import * as yaml from "file:///C:/Users/%E6%9D%A8%E6%96%B0%E9%91%AB/.dsh/profiles/desktop/node_modules/js-yaml/dist/js-yaml.mjs";

const JsExpr = new yaml.Type("tag:yaml.org,2002:js", {
  kind: "scalar", resolve: (d) => typeof d === "string",
  construct: (d) => ({ __jsExpr: d }),
});
const schema = yaml.JSON_SCHEMA.extend(JsExpr);

const files = process.argv.slice(2);
for (const f of files) {
  const t = readFileSync(f, "utf8");
  let r;
  try { r = yaml.load(t, { schema }); }
  catch (e) { console.log(`${f}\n  -> PARSE FAILED: ${String(e.message).split("\n")[0]}`); continue; }
  if (!Array.isArray(r)) { console.log(`${f}\n  -> NOT AN ARRAY: ${typeof r}`); continue; }
  console.log(`${f}\n  -> OK, ${r.length} row(s)`);
  const show = (rows, indent = "     ") => {
    for (const row of rows) {
      if (row.insert) {
        console.log(`${indent}insert:`);
        show(row.insert, indent + "  ");
      } else {
        const keys = Object.keys(row).join(",");
        console.log(`${indent}- id=${JSON.stringify(row.id)} name=${JSON.stringify(row.name)} keys=[${keys}]`);
      }
    }
  };
  show(r);
}
