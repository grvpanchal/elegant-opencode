# @elegant/opencode

An [opencode](https://opencode.ai) plugin that turns the [Universal Frontend Architecture](https://elegantfrontend.training/blog/universal-frontend-architecture) into a microtask harness for **small local models**. The goal: run on **Qwen3 32B** or **Gemma3 27B** via Ollama and produce code with the same quality as a frontier model, by reducing every coding decision to a tightly-scoped microtask the model cannot get wrong.

This plugin reads the architecture from [grvpanchal/elegant](https://github.com/grvpanchal/elegant) — the `skills/` SKILL.md files are the source of truth. A vendored copy of the 14 skills referenced by the pipeline lives in this repo at `skills/` so you can iterate on them locally; override with `ELEGANT_SKILLS_ROOT` to point elsewhere.

---

## Why a skill-driven harness (not a fixture)

Earlier iterations shipped a copy of the chota-react-redux template and edited the variable parts. **That is the wrong technique.** The skills are the contract; the fixture is just one valid output of the contract.

This rewrite removes the fixture entirely. Every microtask is bound to one `SKILL.md` whose Code Patterns + Key Principles are encoded as a pure JS emitter (for fixed microtasks) or a tightly-prompted LLM agent (for variable microtasks). Both return the same envelope:

```json
{ "files": { "<relPath>": "<source>" } }
```

The pipeline IS the architecture. The chota-react-redux template happens to be one byte-identical output of the pipeline because it is the reference embodiment of the same skills.

---

## The pipeline

21 microtasks bound to skills. 15 fixed (zero LLM tokens), 6 variable (small LLM, schema- and manifest-locked).

| Microtask | Skill | Mode | Files emitted |
|---|---|---|---|
| `entity-schema` | — | LLM | (seed; entity object) |
| `ui-theme` | ui-theme | fixed | 5 |
| `app-shell` | server-app-shell | fixed | 9 |
| `state-types` | state-actions | fixed | 1 |
| `state-initial` | state-reducer | fixed | 1 |
| `state-actions` | state-actions | fixed | 2 |
| `state-reducer` | state-reducer | fixed | 2 |
| **`state-selectors`** | state-selectors | LLM | 2 |
| `filters-slice` | state-crud | fixed | 8 |
| `config-slice` | state-crud | fixed | 8 |
| `state-store` | state-store | fixed | 1 |
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
| File-tree byte-identical across runs | yes (sha256 `ac00e9a7…6dd9d955`) |
| LLM calls per run | 5 of 21 (24%) |
| Deterministic emitter calls per run | 15 of 21 (71%) |
| Repair attempts triggered | 870 |
| Recovered after repair (≤3 attempts) | all |
| Generated files per run | 128 (matches the `chota-react-redux` template byte-for-byte) |

```
$ N=100 node test/stability.test.js
{
  "runs": 100,
  "failures": 0,
  "stableTreeAcrossRuns": true,
  "treeHash": "ac00e9a75dc6860c40031af734ecb04d9d16d68baa83c65dc819289a6dd9d955",
  "perRunFiles": 128
}
STABLE
```

A non-Todo entity (`Comment`, no `toggle` op) projects to the same 128-file tree with the entity name woven through every layer (verified by `test/different-entity.test.js`).

---

## Layout

```
@elegant/opencode/
├── opencode.json
├── agents/                       # 7 .md files (1 router + 6 variable-microtask agents)
├── skills/                       # 14 vendored SKILL.md files from grvpanchal/elegant
├── src/
│   ├── index.js                  # opencode plugin entrypoint
│   ├── terminology.js            # 21 microtasks, dependency graph, fixed vs variable
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

## Install & use

```bash
git clone https://github.com/grvpanchal/elegant-opencode
cd elegant-opencode && npm install

# Pull local models and bump context to 32k
ollama pull qwen3:32b
ollama pull gemma3:27b
ollama run qwen3:32b
> /set parameter num_ctx 32768
> /save qwen3:32b-32k
> /bye

# Wire into opencode
ln -s "$PWD/agents" .opencode/agents
cp opencode.json /path/to/your/project/

# In opencode TUI:
> /agent elegant-router
> build a todo app
```

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
