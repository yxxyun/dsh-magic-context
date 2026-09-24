# DSH API migration — 0.1.0-rc.6 → 0.1.7-alpha.2 (COMPLETED)

> **STATUS: done. This file is the historical record, not a to-do list.**
>
> The pin described below shipped: `packages/dsh-plugin` devDependencies are now
> exact-pinned, the fork has since moved its core to upstream Magic Context
> **0.42.6** and its compile baseline to **DSH `0.1.7-rc.1`**, and
> `bun run typecheck` is clean under that baseline (verified 2026-09-24, 15/15
> `@deepseek-ai/*` type packages at `0.1.7-rc.1`, zero errors).
>
> All 12 breaks catalogued here are resolved — a clean `tsc` is the proof, since
> none of them could survive it. The catalogue is kept because it documents the
> real API deltas between rc.6 and 0.1.7, which is what makes the next drift
> recognisable.
>
> Standing practice this session produced: **pinned exact devDependencies make
> the compiler the drift detector**, so the upgrade contract gate is
> `bun install && bun run typecheck && bun test` plus
> `node tools/audit-host-symbols.mjs` (runtime export surface) — see the root
> README.

## Why the pin mattered

The fork used to compile against `@deepseek-ai/dsh-*@0.1.0-rc.6` while the
desktop runtime was `0.1.7-alpha.2`. That drift is invisible to `tsc` and cost a
full debugging session: the plugin read a `session.events` property the rc.6
stubs declare but the runtime does not implement (it exposes
`session.snapshotEvents()`), so `for…of undefined` threw on every session's first
pre-step and silently disabled the whole context plane.

`tools/audit-dsh-api.mjs` finds that class of bug, but only for members that exist
on the runtime object. Pinning the dependencies to the runtime version was the
real fix, and doing so surfaced **12 compile errors** that were genuine API
breaks. They are catalogued below so the migration could be finished deliberately
rather than by guessing — which is how it was finished.

## Reproduce (historical)

```bash
# pin every @deepseek-ai/* package to the runtime version (exact, no caret)
#   runtime at the time: dsh-* = 0.1.7-alpha.2, cordis = 4.0.4,
#                        cordis-plugin-include = 1.0.9
#   current baseline:    dsh-* = 0.1.7-rc.1
# verify against the runtime:  node tools/asar-pkg-versions.mjs
bun install
bun run --cwd packages/dsh-plugin typecheck
```

> Do not `rm bun.lock` as a reflex: regenerate it deliberately, and check
> `git diff --cached --numstat` before committing (this repo has mixed blob line
> endings, so a careless rewrite can show up as whole-file churn).

## The 12 breaks (all fixed)

### A. `surfaceOp` replace fields renamed — **runtime-breaking**

```
coordinator.ts(138,35)  'start' does not exist in '{ op: "replace"; startSeq: SessionSeq; endSeq: SessionSeq }'
coordinator.ts(173,33)  same
compat/dsh-0.1/session.ts(87,33)  same
```

The runtime wants `{ op: "replace", startSeq, endSeq }`; the plugin sent
`{ op: "replace", start, end }`. At runtime it would read `startSeq` / `endSeq`
as `undefined`, so **every surface replace silently broke** — this was the
strongest argument for doing the migration at all.

Corroborated later from the other side: `e2e/verify-live.mjs` folds the surface
using exactly `{ op: "replace", startSeq, endSeq }` against real session logs, and
the fold reproduces the host's live-node set.

### B. `SessionSeq` is now a branded type

```
coordinator.ts(139,7)   number[] not assignable to SessionSeq[]
compat/dsh-0.1/session.ts(88,5)  same
```

Requires branding the seq arrays (`SessionSeq` is `BrandedNumber<'SessionSeq'>`).
The compat seam is the right place to centralise the cast.

### C. `kind: "plugin"` no longer exists — **behavioural**

```
historian-wiring.ts(147,17)
recomp.ts(278,17)
sidekick.ts(113,17)
compat/dsh-0.1/session.ts(62,5)
dreamer.ts(260,5)
```

`MessageSourceMap` no longer contains a `plugin` kind. The valid kinds are
`user | model | tool | system-prompt | model-selection | compact-checkpoint |
user-approval | ptc-mode | tool-registry | agent-message | subagent-settled`
(verify the full list before choosing — see `@deepseek-ai/dsh-llm`'s
`MessageSourceMap`).

This mattered beyond types: the plugin **filters its own injected knowledge
messages** by `source.kind === "plugin"` (e.g. `previewTagPayloadMessages` skips
`plugin` and `skill-catalog`, and `isMagicSource` keys on it). Changing the kind
without updating those checks would make Magic's own messages get tagged and
dropped like user content.

### D. Event renamed

```
session-track.ts(76,5)  "agent/session-start" is not assignable to keyof Events
```

`agent/session-start` is now `agent/created`, with payload
`{ agent, source, signal? }` where `source: SessionStartSource`. The listener
signature and any payload access had to be adapted.

### E. `TypertSchema` no longer exported

```
compat/dsh-0.1/typert.ts(13,3)  Module '@deepseek-ai/dsh-typert-registry/types' has no exported member 'TypertSchema'
```

`dsh-typert-registry` now exports `{ default, TypertRegistry, typertEndpoint,
typertKey, typertPackageKey }` plus `export type * from './types.ts'`. The schema
type had to be located before replacing it.

## How it was resolved

1. **A + B** (mechanical, runtime-critical) — done together, keeping the surface
   CAS paths honest.
2. **D** (event rename) — small, but touched session tracking.
3. **C** (source kind) — required deciding which kind Magic's injected messages
   carry, plus updating every filter that keyed on `"plugin"`.
4. **E** (typert schema) — located the new home first.

Then: `bun run typecheck`, `bun test`, `bun run build`, and re-verification on a
live session that tags of `type='tool'` appear (the metric that proves
assistant/tool tagging works) and that messages still send.

**Why it was reverted until A was ready** (kept as the decision record): shipping
the pin without A would compile-fail, and building anyway would have produced a
bundle whose surface replaces no longer worked — strictly worse than the drift.
The pin is a one-line change to `packages/dsh-plugin/package.json`; it had to land
together with A and B, and it did.
