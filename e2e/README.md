# E2E harness — Magic Context × DSH

This directory holds two independent verification families:

| Family | Runs against | What it proves |
|---|---|---|
| **Live verification** (`verify-live.mjs`) | **your real DSH home** (`~/.dsh`) and the shared Magic SQLite | The regressions that actually shipped are not back: duplicate message ids, duplicated injection watermarks, wrong `§N§` prefixes, tag-number collisions, corrupt session logs |
| **Scratch probe harness** (`scratch-home/`, `overlay-magic-default.yml`) | an isolated `DSH_HOME` + headless profile + a local DSH install | The plugin mounts, injects, tags and writes `harness='dsh'` rows in a clean room — no writes to your real home |

---

## 1. Live verification (`verify-live.mjs`)

Zero setup, read-only. Point it at the DSH home you actually use.

```powershell
$repo = "<path to this clone>"
cd $repo

# the newest session in the default home, default DB
node e2e\verify-live.mjs

# a specific session / a specific log file / another home
node e2e\verify-live.mjs --session 2da68d9f-a235-4a0b-b45f-5ae7ece74b09
node e2e\verify-live.mjs --log "C:\...\session.v4.jsonl.zstd.bak-2026-09-23T15-06-00-534Z"
node e2e\verify-live.mjs --home D:\some\other\.dsh --db D:\some\other\context.db

# turn the §N§-prefix guarantee into a hard assertion from a given moment on
node e2e\verify-live.mjs --since "2026-09-24T01:30:00Z"

# machine-readable
node e2e\verify-live.mjs --json
```

Flags: `--home <DSH_HOME>` · `--session <uuid|dir>` · `--log <file>` ·
`--db <context.db>` · `--recent <K>` (default 20) · `--since <ISO>` · `--json`.

**Exit codes**: `0` all checks passed · `1` at least one check failed ·
`2` the probe itself could not run (missing log/DB/flag). A `WARN` is reported but
does not fail the run.

### The checks

| Check | Invariant | Why it exists |
|---|---|---|
| `log-integrity` | the log decodes frame-by-frame, has a readable header, and no torn tail | A wrongly-appended event once made three sessions unopenable. zstd frames are appended with no index, so a partial write is invisible unless the frames are walked |
| `surface-identity-uniqueness` | no two append-origin nodes share a Chat identity key (`input-message` / `tool` / `command` / `step` / `turn`) | The client keys `input-message` on `String(event.data.id)` **for append-origin events**; a duplicate makes the whole conversation view throw and render **blank** — the agent's replies simply stop appearing |
| `injection-watermark-uniqueness` | in the folded surface, an `mc-kb:` watermark owns exactly one live node | Delivering the same injected batch through both `payload.messages` and `agent.inject()` produced two nodes with **different ids and one watermark** — invisible to an id-keyed check |
| `tag-prefix-integrity` | a persisted `§N§ ` prefix equals that message's own tag number | Keying the preview on the **bare** message id instead of the content id `:p0` missed the existing tag, allocated a fresh number and wrote the **wrong** prefix into the session text — so `ctx_reduce`/`ctx_expand` pointed at the wrong content |
| `tag-number-integrity` | tag numbers are unique | A duplicate means the allocator handed out a number that was already taken |

Two design notes that matter for correctness:

- **`surface-identity-uniqueness` deliberately does NOT fold the surface.**
  Replacements appear *later* in the log and would shadow one of the two duplicate
  nodes; the client's matcher filters on `isAppendSurfaceEvent` over the raw log,
  so folding would hide exactly the bug being checked. `injection-watermark-uniqueness`
  *does* fold, because it asks what is live *now*.
- **`tag-prefix-integrity` needs a boundary.** Pre-fix history violates the
  invariant in several shapes (a bare row *plus* a `:p0` row; a prefix naming a
  number that now belongs to a different message). Those are damage, not
  regressions, so by default they are reported as `anomaly`/`info` (status `WARN`)
  and only `--since` turns them into failures. Pass the moment the **fixed plugin
  was actually loaded** (its deploy mtime or the restart after it) — a message
  written between commit and restart still carries a pre-fix scar.

### Worked example: the suite has teeth

The scratch harness proves presence; the real proof is a **negative** run against
the pristine pre-fix backups (`session.v4.jsonl.zstd.bak-*`, kept beside each
repaired session):

```powershell
node e2e\verify-live.mjs --session b5d8e9de-c621-4802-8349-8dbcc943b0a4 `
     --log "C:\Users\<you>\.dsh\sessions\<slug>\session-b5d8e9de-...\session.v4.jsonl.zstd.bak-2026-09-23T15-06-00-534Z"
# -> [FAIL] surface-identity-uniqueness   colliding=12
#    [FAIL] injection-watermark-uniqueness  mc-kb watermarks=2 owning >1 node=2
#    exit=1
```

The same file passes all identity and watermark checks **after** the repair, and
the live session passes all five.

### Session-log format the reader handles

`session.v4.jsonl.zstd` is a sequence of concatenated zstd frames, one JSONL batch
each. Two traps, both handled in `lib/session-log.mjs`:

1. `zlib.zstdDecompressSync` / `createZstdDecompress` stop after the **first**
   frame, so a naive read returns the header and nothing else (a 12 MB session
   decodes to ~230 bytes). The frames must be walked explicitly by parsing each
   frame header and its block chain.
2. A torn write leaves a partial trailing frame. The reader reports it
   (`torn-tail=YES`) instead of silently dropping it.

`event.time` is **epoch milliseconds**, not an ISO string.

---

## 2. Scratch probe harness (isolated, historical)

A fully scratch `DSH_HOME` + headless profile + local DSH install that mounts the
`magic-standard` thin preset and drives a probe agent through the official
`agentPresets.mount()` setup hook. **No DSH source is modified**, and no
global/npm-global install is touched: the scratch home resolves every
`@deepseek-ai/*` package against its OWN local copy (`e2e/dsh-install`), and the
probe's Magic SQLite lives under `e2e/scratch-data` (via
`MAGIC_CONTEXT_TEST_DATA_DIR`).

> The scratch harness was materialized against the DSH install noted below and is
> **not** wired into the current `0.1.7-rc.1` baseline. `e2e/dsh-install`,
> `e2e/scratch-data` and the junction mesh are gitignored, so a fresh clone has
> the config but not the install. For day-to-day regression checking use
> `verify-live.mjs` (section 1) — it needs no install.

### Layout

| Path | Role |
|---|---|
| `scratch-home/` | Scratch `DSH_HOME` (`--anonymous-user-id`, profiles, sessions) |
| `scratch-home/profiles/test/` | Headless profile: bundles = base + headless + `dsh-magic-context` (link: into the plugin source tree) |
| `scratch-home/profiles/node_modules/` | Profile dependency tree — every `@deepseek-ai/*` entry is a junction into `e2e/dsh-install/node_modules/` |
| `scratch-home/.agent-presets/magic-standard/` | Generated thin preset (run `dsh-magic-context setup` to regenerate) |
| `dsh-install/` | Local isolated DSH install (gitignored) |
| `scratch-data/` | Magic SQLite + liveness markers for probe runs (gitignored) |
| `overlay-magic-default.yml` | `--patch` overlay: `agent-presets` roster + the probe plugin row |
| `magic-e2e-probe.mjs` | The probe (unique session id per run; drives one step) |
| `lib/session-log.mjs` + `verify-live.mjs` | The current verification suite (section 1); works against the scratch home too, via `--home`/`--db`/`--log` |

> `inspect-db.ts` and `read-sessions.ts` were removed: `read-sessions.ts` decoded a
> zstd buffer as text (it never decompressed) and read the pre-v4
> `session.jsonl.zstd` name, and `inspect-db.ts` opened a gitignored scratch DB
> path — so both were dead on arrival in a fresh clone. Their jobs are covered by
> the section 1 checks plus `sqlite3`/`node:sqlite` queries.
>
> The committed `scratch-home/.agent-presets/magic-standard/` files carry the
> absolute paths of the machine that generated them (that DSH release read presets
> from a file directory; from 0.1.7 a preset is a bundle-patch declaration row),
> so they are only useful together with that machine's gitignored `dsh-install/`.
> Regenerate with `setup` before running the scratch probe.

### Why the junction mesh matters (class identity)

The loader, `cordis-plugin-include`, `dsh-agent-presets`, `@deepseek-ai/cordis`
and the core harness module must be SINGLE module instances across the boot
composition, the mounted preset tree and the adapter's own bundles. When the
adapter package is linked into the profile as a SOURCE-TREE junction, its runtime
imports resolve from the package's own `node_modules` (bun store) — copies that
are NOT the profile's — and two hard failures result:

1. `MagicPresetInclude` (the no-write include entry) carries a DIFFERENT
   `EntryGroup.key` symbol than the loader → the loader interpolates the include
   config instead of keeping it literal → patches silently lost (compaction-basic
   never disabled, magic rows never mounted).
2. The host and agent bundles each inline their own core harness module → the
   host's `setDshHarness()` never reaches the agent-side storage writes → rows
   attributed `harness='opencode'`.

Both were fixed: the adapter's `node_modules/@deepseek-ai/*` is junctioned to the
profile copies, and the agent plane calls `setDshHarness()` itself. A real install
(package inside the profile's node_modules) does not need the junctions — this
document exists so the scratch topology never silently regresses.

### Setup / repair of the local DSH install

```powershell
$repo = "<path to this clone>"
# recreate e2e/dsh-install from a known-good DSH install
robocopy <npm-global>\node_modules\@deepseek-ai\dsh "$repo\e2e\dsh-install" /E /NFL /NDL /NJH /NP
```

Repoint every profile junction to the local install (idempotent):

```powershell
$prof  = "$repo\e2e\scratch-home\profiles\node_modules"
$local = "$repo\e2e\dsh-install\node_modules"
foreach ($d in Get-ChildItem $prof -Directory) {
  $i = Get-Item $d.FullName
  if ($i.LinkType) {
    $rel = $i.Target.Substring($i.Target.IndexOf("node_modules") + "node_modules".Length).TrimStart("\")
    Remove-Item $d.FullName -Force
    New-Item -ItemType Junction -Path $d.FullName -Target (Join-Path $local $rel) | Out-Null
  }
}
```

Same for the adapter package's own `node_modules/@deepseek-ai/*` (they must point
at the PROFILE copies, not the bun store):

```powershell
$pkg = "$repo\packages\dsh-plugin\node_modules\@deepseek-ai"
foreach ($d in Get-ChildItem $pkg -Directory) {
  $t = Join-Path $prof "@deepseek-ai\$($d.Name)"
  if (Test-Path $t) {
    $i = Get-Item $d.FullName
    if ($i.LinkType) { Remove-Item $d.FullName -Force }
    New-Item -ItemType Junction -Path $d.FullName -Target $t | Out-Null
  }
}
```

### Run the probe

```powershell
$env:DSH_HOME = "$repo\e2e\scratch-home"
$env:MAGIC_CONTEXT_TEST_DATA_DIR = "$repo\e2e\scratch-data"
$env:DSH_TELEMETRY_DISABLED = "1"
# Real-LLM runs: source the key from the main configuration instead of a dummy.
$env:DEEPSEEK_API_KEY = "dummy"

# 1. regenerate the thin preset, then verify with doctor
node packages\dsh-plugin\dist\cli.js setup --profile test
node packages\dsh-plugin\dist\cli.js doctor --profile test

# 2. boot the LOCAL launcher with the overlay + probe
node e2e\dsh-install\lib\bin.js --profile test --patch e2e\overlay-magic-default.yml "probe"

# 3. verify durable evidence (harness='dsh' rows, cached m0, canonical keys).
#    verify-live.mjs takes the scratch home/DB directly, so the same checks the
#    live suite runs also cover a probe run:
node e2e\verify-live.mjs --home "$repo\e2e\scratch-home" `
     --db "$repo\e2e\scratch-data\cortexkit\magic-context\context.db"
```

Expected probe output:

```
PROBE: agent joined preset "magic-standard"
dsh: AUTH: Authentication Fails, ... (dummy key — expected)
PROBE: session=session-e2e-probe-<ts> events=17 magicMessages=0
```

`magicMessages=0` is EXPECTED for a single auth-failing step: the knowledge
baseline is injected during the first pre-step but materializes as a session event
only with the NEXT pre-step batch (DSH "inject, do not rewrite" semantics). The
durable gate evidence is the `session_meta` / `session_projects` rows under
`harness='dsh'` with canonical `dsh:<home-hash>:<session-id>` keys and a non-null
`cached_m0_bytes`.

### Stock preset integrity guard

The raw `cordis-plugin-include` write-back truncated the SHIPPED stock preset to
`[]` on the first agent teardown (DSH loader behavior; `dsh-agent-presets` defends
with `PresetTree.write()` no-op). The thin preset therefore mounts the stock file
through `MagicPresetInclude` (dist/entries/preset-include.js, `write()` no-op) and
doctor fails the preset check if the include row names the raw include. Verify
after any run:

```powershell
Get-FileHash "$repo\e2e\dsh-install\config\agent-presets\standard\agent.cordis.yml"
# expect CB98756A9ED76CA351A45A0BA138A97BF0AB7EEAD4FE2F1E9D1C9F9EC97937F0 (13047 bytes)
```

If the file is ever truncated again, restore it from the pristine tarball copy:

```powershell
npm pack <the DSH version the scratch install was built from> --pack-destination <tmp>
tar -xzf <tmp>\*.tgz -C <tmp>
Copy-Item <tmp>\package\config\agent-presets\standard\agent.cordis.yml "$repo\e2e\dsh-install\config\agent-presets\standard\agent.cordis.yml"
```

### Real-install test (2026-08-15)

A second, REAL installation path was exercised with a **packed tarball** instead
of a source-tree link, against the REAL npm registry dependency tree:

- `e2e/dsh-real-install/` (gitignored) — a real `npm install --prefix` of DSH.
  NOTE: (a) this minimal npm tree cannot BOOT dsh itself (`exit 13` unsettled
  await) and (b) it is NOT a complete module graph (npm re-installs can drop
  transitive deps like `diff`/`yaml`/`zod`) — do NOT use it as the stock preset
  source; point setup at the full global install instead.
- `e2e/real-home/` (gitignored) — a real `DSH_HOME` (copied `settings.yaml` +
  `.credentials.yaml`) with an `install-test` profile whose dependencies came from
  a **packed tgz** (the `workspace:*` adapter dep rewritten to a `file:` tgz
  reference — the pre-publish step).
- **Verified end-to-end (closed loop)**: `npm install` → `setup` (thin preset,
  stock sourced from the FULL global install) → `doctor` → probe run against the
  REAL shared SQLite: `agent joined preset "magic-standard"`, **`magicMessages=4`**
  with a real `mc-op:*` knowledge baseline, `§N§` tags written, `session_meta`
  `harness='dsh'` + m0 bytes, and the local relay model answered with the
  Magic-injected context in its reply.
- **Post-release rename verification (2026-08-15)**: after the package rename to
  the bare `dsh-magic-context` / `dsh-magic-context-adapter` names, the install was
  re-verified on a NON-GLOBAL dsh with a fresh scratch `DSH_HOME`: setup →
  doctor 6/6 → probe: `joined magic-standard`, `magicMessages=4`, real relay model
  answered `§3§`, shared SQLite `harness='dsh'` rows + tags written.
- **Findings that only this test could surface**:
  1. `settings.yaml` MUST actually live in `DSH_HOME` (a copy-step bug silently
     sent it to the user home dir; without it the model route falls back to
     `deepseek-official` and the "QUOTA" error comes from the OFFICIAL key, not
     the relay).
  2. The thin preset's stock `path` must resolve in a COMPLETE dsh module graph.
  3. `file://` include entries are the correct design: bundle-name subpaths
     resolve from the stock directory's module walk, which never reaches the
     profile's node_modules.
  4. npm caches `file:` tgz by path — bump the tgz name when iterating.

Pre-publish checklist proven here: publish the adapter package first (or rewrite
the `workspace:*` dep), and instruct users to install through the full DSH
installation (pnpm/dsh plugin or a complete node_modules graph).

## 3. Related gates

| Tool | Purpose |
|---|---|
| `tools/audit-host-symbols.mjs` | Every host symbol the port imports at runtime, checked against the shipped `app.asar` |
| `tools/check-dist-graph.mjs` | `dist` reference closure, no dead chunks |
| `packages/dsh-plugin` `bun run typecheck` | DSH API drift detector (devDependencies are pinned exactly) |
