# Magic Context for DSH

<div align="center">

**English** | [中文](./README.md)

![Version](https://img.shields.io/badge/version-0.1.3-blue.svg)
![DSH](https://img.shields.io/badge/DSH-0.1.7--rc.1-111827.svg)
![Magic Context](https://img.shields.io/badge/Magic%20Context-0.42.6-7C3AED.svg)
![Harness](https://img.shields.io/badge/harness-dsh-5391FE.svg)
![Community](https://img.shields.io/badge/community-port-0F766E.svg)
![Unit tests](https://img.shields.io/badge/unit%20tests-212%20pass-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

A **community port** of [Magic Context](https://github.com/cortexkit/magic-context)
to [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH).
Not affiliated with the official DSH or Magic Context projects; capability
alignment is tracked in [Features](./docs/FEATURES.md).

[E2E harness](./e2e/README.md) · [Verification tools](#verification-tools)

</div>

---

## About

An adapter layer that ports Magic Context to DSH: DSH sessions can use Magic
Context's knowledge injection, context management and memory, while sharing
**the same SQLite store** as OpenCode/Pi (`harness='dsh'` row isolation) with
zero changes to OpenCode/Pi behavior.

Use cases:

- Reuse existing Magic Context memories in DSH (shared with OpenCode/Pi).
- DSH sessions that want m0/m1 knowledge injection, §N§ tags, historian
  compaction, and Dreamer scheduled tasks.
- DSH users who want the ctx_* tool family (search/memory/note/expand/reduce)
  and todowrite.

Parity covers injection (m0/m1 dual messages, visible on the first turn, §N§
tagged on the first turn), compaction (small-window chunk budget, an independent
historian model route, `<session-history>` folding after publish), the dual nudge
channels, heuristic cleanup and the config bridge — all aligned with Magic
Context 0.42.6 (Pi/OpenCode) semantics.

## Installation

In your DSH profile's `package.json` (the profile directory is
`$DSH_HOME/profiles/<name>/`):

```json
{
  "dependencies": {
    "dsh-magic-context": "github:yxxyun/dsh-magic-context#v0.1.3&path:/packages/dsh-plugin"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-magic-context"]
    }
  }
}
```

> ⚠️ Keep your profile's existing `dsh.profile.bundles` entries (e.g.
> `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app`, `@deepseek-ai/dsh-headless`)
> and only **append** `"dsh-magic-context"`.

For local development use a `file:` dependency pointing at
`fork/stage/dsh-magic-context` (produced by `fork/tools/deploy-to-profile.mjs`):

```json
{ "dependencies": { "dsh-magic-context": "file:../../stage/dsh-magic-context" } }
```

> ⚠️ The published manifest must NOT carry the source manifest's `workspace:*`
> dependencies: a DSH profile is a separate single-package pnpm workspace, so pnpm
> aborts with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` and the GUI's plugin
> install/uninstall surfaces an unrelated-looking error. `deploy-to-profile.mjs`
> strips them; the bundle's `dist` is self-contained and resolves everything else
> through `peerDependencies`.

Then install dependencies and restart DSH:

```sh
dsh plugin --profile <name> install
# or: cd $DSH_HOME/profiles/<name> && pnpm install
```

After restarting, initialize:

```sh
dsh-magic-context setup    # generates the magic-standard thin preset
dsh-magic-context doctor   # verifies the install
```

Select the `magic-standard` preset for new sessions (Web UI: Settings → Agent
preset, or `settings.yaml: agent-presets.default: magic-standard`).

> ⚠️ **Prerequisite**: Magic's agent-side capabilities (knowledge injection,
> ctx_* tools, /ctx-* commands, historian, Dreamer, the Magic compaction
> policy) are loaded **only in sessions that select the `magic-standard`
> preset**. Sessions without it run with pure official semantics — only the
> host side stays resident (shared-DB initialization + status/diagnostics
> endpoints), with no Magic intervention. To make the plugin effective by
> default, set `settings.yaml`'s `agent-presets.default` to `magic-standard`.

The first session automatically creates the shared SQLite
(`~/.local/share/cortexkit/magic-context/context.db`).

## Feature overview

- **Knowledge mode**: m0/m1 baseline injection (incl. Mural images), auto-search, §N§ tags
- **Context management**: DshTranscript + SurfaceMutationCoordinator (CAS +
  outbox saga), historian background compartments, Magic compaction policy,
  cache classification SOFT+/SOFT/HARD
- **Automation**: all Dreamer tasks (including the **tool-requiring** ones, which
  run through a `ctx.subagents` tool worker), /ctx-recomp /ctx-wrapup
  /ctx-session-upgrade, /ctx-embed, feedback bridge
- **Maintenance**: setup/doctor, upgrade contract gate, no-write-back safety
  (shipped preset mounted read-only)
- **Web**: status card + Remote diagnostics endpoint

Full parity table: [docs/FEATURES.md](./docs/FEATURES.md).

## Verification status

| Item | Result |
|---|---|
| Unit tests (dsh-plugin port subset) | **212 pass / 5 fail** — the 5 are Windows-only `EBUSY` (temp-dir lock) leftovers, unrelated to port logic |
| `tsc --noEmit` | **0 errors**, compiled against the **DSH `0.1.7-rc.1` type packages** (see the contract gate below) |
| Host symbol audit | **24/24 present** (checked against the shipped `app.asar` runtime exports, not `@types`) |
| dist reference graph | **CLEAN** (20 chunks, 0 dead files) |
| Live-session verification | see `e2e/verify-live.mjs`: **all 5 checks green** (including "duplicate message id" and "injection watermark uniqueness") |

**Contract gate (run before any upgrade)**: DSH's API drifts between minor
versions, and this port pins its devDependencies exactly, so **the compiler is
the drift detector**:

```sh
cd packages/dsh-plugin
# bump @deepseek-ai/* to the target DSH version, then
bun install && bun run typecheck && bun test
node ../../tools/audit-host-symbols.mjs     # runtime export surface (exit 0/1/2)
```

Current baseline: **DSH `0.1.7-rc.1`**, **Magic Context upstream 0.42.6** (shared
schema fence `v85`; boot log
`upstream migration lane at boot: database=v85, supported_fence=v85`).

`peerDependencies` deliberately stay at `^0.1.7-alpha.2`: that range was checked
with the market's own semver resolver and **admits both `0.1.7-alpha.2` and
`0.1.7-rc.1`** (tightening it to `-rc.1` would drop support for the older one).

## Verification tools

| Tool | Purpose |
|---|---|
| `e2e/verify-live.mjs` | 5 assertions against a **real DSH session**: log integrity; surface identity-key uniqueness (a duplicate `data.id` renders the conversation blank); injection watermark uniqueness; the persisted `§N§ ` prefix matching that message's own tag number; no duplicate tag numbers. Exit `0` pass / `1` a check failed / `2` the probe itself could not run |
| `tools/audit-host-symbols.mjs` | Verifies every host symbol the port actually imports at runtime against the shipped `app.asar` (it refuses to run rather than print a false result) |
| `tools/check-dist-graph.mjs` | Walks `dist` transitively from the 7 package entries and proves the reference graph is closed with no dead chunks |

## Known issues & boundaries

- **No DSH source modifications**; never rewrites `llm/stream messages[]`;
  OpenCode/Pi behavior unchanged.
- **`§N§` numbering is per session.** DSH's resume/seed path forks a seeded child
  session (`header.parentSession`), and the child numbers tags from §1 again — so
  a `§N§` learned before the fork no longer resolves after it. That is a
  consequence of upstream numbering semantics, not a defect.
- **Historical scars**: versions before 2026-09-24 keyed the §N§ preview on the
  **bare message id**, so one message could own two tag rows and persist the
  wrong number into the session text (fixed in `17f9da7`). Sessions written
  before that still show such scars; `verify-live.mjs` reports them as
  information by default and only fails on them with `--since <deploy time>`.
- **The `opencode-go` provider depends on an upstream plugin**: on DSH
  `0.1.7-rc.1`, `dsh-opencode-go` fails to register its model provider (its
  registration is gated on finding a credential, and the failure is swallowed
  into a logger DSH does not persist). Consequence: **the historian cannot call
  that model** (`no adapter registered for provider "opencode-go"`). That is an
  upstream packaging problem; waiting for the author's release.
- Known differences: [docs/FEATURES.md](./docs/FEATURES.md).

## License

MIT (same as Magic Context and DSH). Upstream copyright notices are in each
package's `NOTICE`.
