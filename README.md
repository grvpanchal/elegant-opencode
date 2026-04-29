# @elegant/opencode

An [opencode](https://opencode.ai) plugin that turns the [Universal Frontend Architecture](https://elegantfrontend.training/blog/universal-frontend-architecture) into a microtask harness for **small local models**. The goal: run on **Qwen3 32B** or **Gemma3 27B** via Ollama and produce code with the same quality as a frontier model, by reducing every coding decision to a tightly-scoped microtask the model cannot get wrong.

This plugin reads the architecture from [grvpanchal/elegant](https://github.com/grvpanchal/elegant) — the `skills/` SKILL.md files are the source of truth. A vendored copy of the 16 skills referenced by the pipelines lives in this repo at `skills/` so you can iterate on them locally; override with `ELEGANT_SKILLS_ROOT` to point elsewhere.

## Archetypes

The harness produces apps in well-defined **archetypes**. Each archetype is a
named pipeline + manifest + emitter set. The seed `entity-schema` microtask
declares the archetype `kind`; the orchestrator picks the matching pipeline.

| Archetype     | Example spec            | Key skills                                                  |
|---------------|-------------------------|-------------------------------------------------------------|
| `crud-list`   | "build a todo app"      | state-crud, state-actions(CRUD verbs), filters-slice        |
| `fetch-card`  | "build a weather app"   | state-ajax, state-actions(REQUEST/RECEIVE/FAIL), state-middleware (ajax) |

Both archetypes share the same `app-shell`, `ui-theme`, `ui-base-atoms`,
`ui-context-atoms`, `ui-skeleton`, `ui-layout`, `atomic-provider`, and
`config-slice` emitters — only the entity-shaped state and the entity-shaped
UI molecules / organism / container differ. Adding a new archetype = adding
one entry to `ARCHETYPES` in `src/terminology.js`, one builder map in
`src/file-manifest.js`, and one set of emitters under
`src/emitters/<archetype>/`.

---

## Why a skill-driven harness (not a fixture)

Earlier iterations shipped a copy of a static template and edited the variable parts. **That is the wrong technique.** The skills are the contract; the fixture is just one valid output of the contract.

This rewrite removes the fixture entirely. Every microtask is bound to one `SKILL.md` whose Code Patterns + Key Principles are encoded as a pure JS emitter (for fixed microtasks) or a tightly-prompted LLM agent (for variable microtasks). Both return the same envelope:

```json
{ "files": { "<relPath>": "<source>" } }
```

The pipeline IS the architecture. The crud-list archetype's reference embodiment is **chota-react-saga** — async CRUD with redux-saga middleware, three-phase action lifecycle (REQUEST / SUCCESS / ERROR), per-slice operations.js + helper.js + a localStorage-backed utils/api.js. That template is the source-of-truth for what the emitters produce; small models get the same skill prompts the deterministic emitters were derived from. Switching to chota-react-rtk or chota-vue-pinia later is a matter of swapping the emitter set, not the orchestrator.

---

## The crud-list pipeline

25 microtasks bound to skills. 19 fixed (zero LLM tokens), 6 variable (small LLM, schema- and manifest-locked). The fetch-card pipeline shares the
same shape; it swaps `filters-slice` for `ajax-middleware` and the entity-
shaped state + UI emitters for ajax-flavoured ones.

| Microtask | Skill | Mode | Files emitted |
|---|---|---|---|
| `entity-schema` | — | LLM | (seed; entity object) |
| `ui-theme` | ui-theme | fixed | 5 |
| `app-shell` | server-app-shell | fixed | 9 |
| `state-types` | state-actions | fixed | 2 |
| `state-initial` | state-reducer | fixed | 1 |
| `state-actions` | state-actions | fixed | 2 |
| `state-helper` | state-saga | fixed | 2 |
| `state-reducer` | state-reducer | fixed | 2 |
| **`state-selectors`** | state-selectors | LLM | 2 |
| `filters-slice` | state-crud | fixed | 8 |
| `config-slice` | state-crud | fixed | 8 |
| `utils-api` | server-api | fixed | 2 |
| `state-operations` | state-saga | fixed | 2 |
| `state-root-sagas` | state-saga | fixed | 2 |
| `state-store` | state-store | fixed | 3 |
| `atomic-provider` | server-app-shell | fixed | 2 |
| `ui-base-atoms` | ui-atom | fixed | 22 |
| `ui-context-atoms` | ui-atom | fixed | 18 |
| **`ui-domain-atom`** | ui-atom | LLM | 6 |
| `ui-skeleton` | ui-skeleton | fixed | 9 |
| `ui-layout` | ui-template | fixed | 4 |
| **`ui-molecule`** | ui-molecule | LLM | 12 |
| **`ui-organism`** | ui-organism | LLM | 10 |
| **`container`** | server-container | LLM | 8 |
| `page` | server-page | fixed | 3 |

Each variable microtask receives, in its prompt:

1. The compacted SKILL.md slice (Key Principles + Code Patterns).
2. A concrete in-repo exemplar.
3. The exact relPath set it must emit (from `src/file-manifest.js`).
4. Structural invariants every file must satisfy.
5. Only the upstream microtask outputs it depends on (paths only — never full source).

Outputs are validated by Ajv (envelope shape) AND by the per-microtask manifest (required relPaths + structural invariants). Invalid → repair prompt → max 3 attempts.

---

## Stability — `build a todo app`

100 runs with adversarial small-model noise (code fences, prose preambles, dropped files, empty content, stray files):

| Metric | Result |
|---|---|
| Runs | 100 |
| Hard failures | 0 |
| File-tree byte-identical across runs | yes (sha256 `89ad6748…eae5762d`) |
| LLM calls per run | 5 of 25 (20%) |
| Deterministic emitter calls per run | 19 of 25 (76%) |
| Repair attempts triggered | ~870 |
| Recovered after repair (≤3 attempts) | all |
| Generated files per run | 136 (saga-shaped: chota-react-saga template; the deterministic emitters are derived from that template's source-of-truth) |

```
$ N=100 node test/stability.test.js
{
  "runs": 100,
  "failures": 0,
  "stableTreeAcrossRuns": true,
  "treeHash": "89ad674880014d20735965fd371e6d6004fb36327a1e3b17fe123a35eae5762d",
  "perRunFiles": 136
}
STABLE
```

A non-Todo entity (`Comment`, no `toggle` op) projects to a saga-shaped tree with the entity name woven through every layer (verified by `test/different-entity.test.js`).

---

## Layout

```
@elegant/opencode/
├── opencode.json
├── agents/                       # 7 .md files (1 router + 6 variable-microtask agents)
├── skills/                       # 16 vendored SKILL.md files from grvpanchal/elegant
├── src/
│   ├── index.js                  # opencode plugin entrypoint
│   ├── terminology.js            # 25 microtasks (crud-list), dependency graph, fixed vs variable
│   ├── file-manifest.js          # required relPath set + structural invariants per microtask
│   ├── skills-loader.js          # reads grvpanchal/elegant SKILL.md + compacts
│   ├── exemplars.js              # one in-repo exemplar per variable microtask
│   ├── context-builder.js        # builds (system + user + schema + manifest) per microtask
│   ├── deterministic-emitters.js # dispatcher over per-skill emitters
│   ├── emitters/                 # 20 per-skill emitters + _naming.js + _operation-patterns.js
│   ├── orchestrator.js           # topological pipeline + repair loop
│   ├── code-emitter.js           # merges {files} maps and writes to disk
│   ├── validator.js              # Ajv + manifest two-layer validation
│   └── schemas/
│       ├── entity-schema.schema.json
│       └── files.schema.json     # universal `{files: {relPath: source}}` envelope
├── test/
│   ├── sim-llm.js                # small-model simulator (drift, fences, prose, missing files)
│   ├── harness.test.js           # one-run smoke test
│   ├── stability.test.js         # N-run stability harness (default 25; N=100 used in CI)
│   └── different-entity.test.js  # sanity-check on a non-Todo entity
└── scripts/run-todo-demo.js
```

---

## Live demo

Every push regenerates BOTH demos through the harness and publishes them
side-by-side to GitHub Pages — a landing page that links to:

  • `/todo/`     — `build a todo app`     (crud-list archetype, 128 files)
  • `/weather/`  — `build a weather app`  (fetch-card archetype, 107 files)

`.github/workflows/deploy.yml` runs `npm run demo:todo` and
`npm run demo:weather` (the deterministic same-orchestrator path: same
emitters, same skills, same manifest validation, driven by a sim-LLM stub
so CI builds are reproducible and free), `vite build`s each emitted app,
and assembles the wrapper site with `scripts/build-pages.js`.

To enable Pages on a fresh clone: repo *Settings → Pages → Source = GitHub
Actions* (one-time setup), then push to `main` or trigger the workflow
manually. Locally:

```bash
npm install
npm run demo:todo
(cd demo-output && npm install && npm run build)
npm run demo:weather
(cd weather-output && npm install && npm run build)
npm run pages:build
# serve gh-pages/ with any static server
```

The live opencode path (`opencode run "build a todo app"` or
`/agent elegant-router > build a todo app` in the TUI) drives the same
pipeline through real subagents on free Zen models — see
[Install & use](#install--use). The plugin's LLM bridge dispatches each
variable microtask through `client.session.create({parentID, title:"elegant:<task>"})`
followed by `client.session.prompt({path:{id}, body:{agent, system, parts}})`,
extracting concatenated `TextPart.text` as the model output. End-to-end
verified: a full live run dispatched all 6 variable microtasks, recovered
from one repair attempt on `ui-molecule`, and emitted the canonical 128
files. Note that the manifest check (file set + structural anchors) does
not catch every kind of small-model drift — a free-tier model may still
emit semantically wrong import paths or value names, so CI uses the
deterministic same-orchestrator path for reproducibility.

---

## Install & use

```bash
git clone https://github.com/grvpanchal/elegant-opencode
cd elegant-opencode && npm install

# In opencode TUI:
> /agent elegant-router
> build a todo app
```

The shipped `opencode.json` wires the 7 agents to OpenCode Zen's free-tier
models so you can experiment with zero credentials and zero local GPU:

| Agent             | Model                              |
|-------------------|------------------------------------|
| elegant-router    | `opencode/big-pickle`              |
| organism-agent    | `opencode/big-pickle`              |
| molecule-agent    | `opencode/minimax-m2.5-free`       |
| atom-agent        | `opencode/gpt-5-nano`              |
| container-agent   | `opencode/hy3-preview-free`        |
| selectors-agent   | `opencode/gpt-5-nano`              |
| schema-agent      | `opencode/gpt-5-nano`              |

These tiers are free at time of writing; OpenCode Zen rotates the free pool, so
swap any retired ID with another from `opencode models`. To run on local
Ollama instead, replace each agent's `model` with e.g. `ollama/qwen3:32b-32k`
and add a matching `provider.ollama` block.

---

## How it stays stable on small models

1. **The skill IS the structure.** Fixed microtasks encode the skill's Code Patterns directly in JS — no LLM ever sees them. Variable microtasks see the same skill slice as a prompt + the exact relPath set they must emit. The model cannot pick paths.
2. **Two-layer validation.** Ajv (`files.schema.json`) catches malformed envelopes; the per-microtask manifest catches missing files, stray files, empty content, and missing structural anchors (e.g. `export default`).
3. **Repair loop.** Failures are surfaced as a list of error strings. The agent is asked to re-emit with those failures fixed — never to "improve" or "extend".
4. **Context isolation.** Subagents run with `tools: { read:false, write:false, bash:false, task:false }` and a single-purpose system prompt.
5. **Low temperature.** `chat.params` hook pins all `*-agent` calls to `temperature: 0.05, top_p: 0.9`.
6. **Entity is sovereign.** Naming, plurality, slice, ops are derived from `entity-schema` everywhere downstream — so LLM drift at one stage cannot bleed into another.

---

## Adding a new framework

Replace the bodies of `src/emitters/*.js` (and update `src/file-manifest.js` with the new relPath set). The microtask graph + agent prompts + JSON contract are framework-agnostic — only the emitters and manifest are coupled to chota / React / classic redux today.

---

## License

MIT — same as grvpanchal/elegant.
