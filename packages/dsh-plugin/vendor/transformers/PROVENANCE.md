# Vendored Transformers.js sibling bundles

These two files are **upstream's own build outputs**, copied verbatim. They are
the fallback the core loads when the primary path — a bare
`import("@huggingface/transformers")` resolved from `node_modules` — cannot work,
which is exactly the DSH situation (the port ships a self-contained bundle whose
manifest carries no `dependencies`).

    transformers-web.js         855 KB  sha256 84F36B1074793E4C2273EF1499983F554F4B469E092EB8B379EE369288E1BDFC
    transformers-node-wasm.js   908 KB  sha256 D520E52C9ED5A3DEEDC50EC66CC5B1EED46E1BE3670695F6E5B9CBCBDC3A8C86

## Source

    package: @cortexkit/opencode-magic-context
    version: 0.42.6
    tarball: https://registry.npmjs.org/@cortexkit/opencode-magic-context/-/opencode-magic-context-0.42.6.tgz
    paths:   package/dist/transformers-web.js
             package/dist/transformers-node-wasm.js

Upstream's own sources for these are
`packages/plugin/src/features/magic-context/memory/transformers-web-entry.ts`
and `transformers-node-wasm-entry.ts` (both vendored here), bundled by
`packages/plugin/scripts/build-transformers-node-wasm.ts` — a script that was
**not** vendored into this fork (the vendored copy of `packages/plugin` carries
`src/` only) and is not published in the npm tarball. Reproducing that build from
source is a known follow-up; see "Refreshing" below.

## Why both files, and why they are not enough on their own

`embedding-local.ts` loads, in order:

1. `import("@huggingface/transformers")` — the normal-install path.
2. `import("onnxruntime-web")` — the WASM runtime.
3. `new URL("./transformers-web.js", import.meta.url)` and
   `./transformers-node-wasm.js` — these siblings.

The port's entry sits at `dist/entries/agent-*.js`, so the siblings must land in
`dist/entries/` for those `./` specifiers to resolve; the build copies them there
from this directory (they are never edited by hand).

Both siblings keep `onnxruntime-web` as an **external** import — they alias the
optional native addons away (`onnxruntime-node` → `onnxruntime-web`,
`sharp` → a shim) but still need the WASM runtime resolvable at run time. That is
why `packages/dsh-plugin/package.json` declares `onnxruntime-web`, so the profile
install provides it (~138 MB, mostly four `.wasm` binaries). Upstream needs it
too: it is a transitive dependency of `@huggingface/transformers`.

The embedding model itself is *not* vendored — the core caches it under
`<magic-context storage>/models`, and it is already present on this machine
(`Xenova/all-MiniLM-L6-v2`).

## Refreshing

Re-download the tarball for the version of the vendored core, re-extract the two
paths above, and update the hashes in this file. Verify with:

    bun run build
    node tools/check-dist-graph.mjs        # the siblings are now REQUIRED, not optional

A source-built replacement would remove the need for this directory; it depends
on reconstructing upstream's bundler invocation (browser conditions for the web
sibling, `onnxruntime-node`/`sharp` aliases for the node-wasm sibling), which the
vendored sources support but the vendored scripts do not currently provide.
