# DSH API migration — 0.1.0-rc.6 → 0.1.7-alpha.2

The fork compiles against `@deepseek-ai/dsh-*@0.1.0-rc.6` while the desktop
runtime is `0.1.7-alpha.2`. That drift is invisible to `tsc` and already cost a
full debugging session: the plugin read a `session.events` property the rc.6
stubs declare but the runtime does not implement (it exposes
`session.snapshotEvents()`), so `for…of undefined` threw on every session's first
pre-step and silently disabled the whole context plane.

`tools/audit-dsh-api.mjs` finds that class of bug, but only for members that exist
on the runtime object. Pinning the dependencies to the runtime version is the
real fix, and doing so surfaces **12 compile errors** that are genuine API
breaks. They are catalogued here so the migration can be finished deliberately
rather than by guessing.

## Reproduce

```bash
# pin every @deepseek-ai/* package to the runtime version (exact, no caret)
#   runtime versions: dsh-* = 0.1.7-alpha.2, cordis = 4.0.4,
#                     cordis-plugin-include = 1.0.9
# verify against the runtime:  bun run tools/asar-pkg-versions.mjs
rm bun.lock && bun install
bun run --cwd packages/dsh-plugin typecheck
```

## The 12 breaks

### A. `surfaceOp` replace fields renamed — **runtime-breaking**

```
coordinator.ts(138,35)  'start' does not exist in '{ op: "replace"; startSeq: SessionSeq; endSeq: SessionSeq }'
coordinator.ts(173,33)  same
compat/dsh-0.1/session.ts(87,33)  same
```

The runtime wants `{ op: "replace", startSeq, endSeq }`; the plugin sends
`{ op: "replace", start, end }`. At runtime the runtime would read `startSeq` /
`endSeq` as `undefined`, so **every surface replace silently breaks**. This is
the one to fix first and the strongest argument for doing the migration at all.

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

This matters beyond types: the plugin **filters its own injected knowledge
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
signature and any payload access must be adapted.

### E. `TypertSchema` no longer exported

```
compat/dsh-0.1/typert.ts(13,3)  Module '@deepseek-ai/dsh-typert-registry/types' has no exported member 'TypertSchema'
```

`dsh-typert-registry` now exports `{ default, TypertRegistry, typertEndpoint,
typertKey, typertPackageKey }` plus `export type * from './types.ts'`. Find where
the schema type moved (possibly `@deepseek-ai/dsh-typert-protocol`) before
replacing it.

## Ordering

1. **A + B** (mechanical, runtime-critical) — do together, keep the surface CAS
   paths honest.
2. **D** (event rename) — small, but touches session tracking.
3. **C** (source kind) — needs a decision about which kind Magic's injected
   messages should carry, plus updates to every filter that keys on `"plugin"`.
4. **E** (typert schema) — locate the new home first.

Then: `bun run typecheck`, `bun test`, `bun run build`, and re-verify on a live
session that tags of `type='tool'` appear (the metric that proves assistant/tool
tagging works) and that messages still send.

## Why this was reverted rather than half-applied

Shipping the pin without A would compile-fail, and building anyway would produce
a bundle whose surface replaces no longer work — strictly worse than the current
drift. The pin is a one-line change to `packages/dsh-plugin/package.json`; do it
together with A and B.
