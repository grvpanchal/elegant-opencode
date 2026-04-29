# TRD — Loosening the harness's fixed-prompt determinations

Status: **draft for discussion**. Author: harness rewrite. Last updated 2026-04-29.

This TRD names the places where the current pipeline is "fixed" in ways that
fight the goal of building a wide range of apps from short English prompts,
and lays out three directions we can take. It is a discussion starter, not a
plan of record.

---

## 1. Where we are today

The harness has three layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SEED        spec → entity-schema   (sim-LLM uses a keyword match;   │
│                                        production schema-agent is an   │
│                                        LLM bound to a fixed JSON       │
│                                        schema)                         │
│ 2. ROUTE       entity.kind → pipeline + manifest + emitter set         │
│                (deterministic table lookup)                            │
│ 3. EMIT        each microtask runs its emitter (fixed) or its LLM      │
│                agent (variable) and writes files                       │
└────────────────────────────────────────────────────────────────────────┘
```

There are five "fixed prompt determinations" in this stack today:

| # | Where                          | What's hard-coded                                                                                               |
|---|--------------------------------|-----------------------------------------------------------------------------------------------------------------|
| F1| `test/sim-llm.js`              | `/todo\|task\|comment\|product\|list/` → TODO_ENTITY, `/weather\|forecast\|climate/` → WEATHER_ENTITY            |
| F2| `test/sim-llm.js`              | TODO_ENTITY and WEATHER_ENTITY are full record literals — slice, fields, ops, queryField, responseFields, …    |
| F3| `src/terminology.js`           | Closed `ARCHETYPES = { "crud-list", "fetch-card" }`                                                            |
| F4| `src/schemas/entity-schema.schema.json` | `kind` is an enum of those two literals; `anyOf` branches require `operations` xor `(queryField + responseFields)` |
| F5| Emitters                       | crud-list expects `entity.operations` ⊂ {create,edit,update,toggle,delete}; fetch-card expects `entity.responseFields[]` |

F1 + F2 are sim-LLM artifacts only — they evaporate the moment a real LLM
runs the seed. F3 + F4 + F5 are the real constraints: even with a perfect
LLM, the harness can only build the two archetypes it knows.

The result: "build a kanban board" or "build a recipe wizard" today either
forces the sim-LLM to pick the wrong fixture, or — with a real LLM — gets
classified to one of the two archetypes and produces a list-with-filters
or a query-and-card app even though that's not what was asked for.

---

## 2. Goals

| Goal                                                    | Why                                                                                            |
|---------------------------------------------------------|------------------------------------------------------------------------------------------------|
| G1. Same prompt → same artifact, every run              | Current contract; the byte-stable hash for `build a todo app` must keep landing on `ac00e9a7…` |
| G2. Open-ended specs do not silently degrade            | "Build a kanban board" should NOT silently emit a Todo app                                     |
| G3. Adding an archetype is a small, local diff          | One pipeline + one manifest + one emitter dir, like today, but no schema enum churn            |
| G4. The seed step is the only place archetype is decided| Once `kind` is set, the rest of the pipeline is a pure function of the entity                  |
| G5. The harness can refuse / ask                        | If the spec doesn't match any registered archetype, fail loudly rather than degrade            |

Non-goals: changing the universal architecture; changing the skills layer;
producing apps in archetypes we have not built emitters for.

---

## 3. Three directions

Each option keeps F2/G1 (canonical entities for sim-LLM stability) but
attacks F3–F5 differently.

### Option A — Open archetype registry, classifier is just a hint

> Replace the closed enum with a registry. Every archetype self-registers a
> `detect(spec) → score` plus its pipeline / manifest / emitters. The seed
> picks the highest-scoring archetype and surfaces the score; if all
> scores are below a threshold the harness aborts with a list of
> registered archetypes.

```js
registerArchetype({
  kind: "crud-list",
  pipeline: [...],
  manifestBuilders: {...},
  emitters: {...},
  detect: (spec) => /todo|task|list|kanban|board/i.test(spec) ? 0.9 : 0,
  defaultEntity: TODO_ENTITY,
});
```

Pros:
- Smallest diff from today
- Adding an archetype is one `registerArchetype()` call
- `kind` enum disappears from the JSON schema (replaced by `archetypeOf()` reflection)

Cons:
- Detection is still pattern-matching — slightly better but the same brittleness moved into each archetype
- Doesn't help when a real LLM picks `kind` directly (the detector is ignored)

Verdict: **best minimal step**. Closes F3 mostly; F1/F4 partially.

### Option B — Two-layer seed: intent extractor + intent→archetype map

> Schema-agent's job becomes "extract a free-form intent record":
> `{ name, slice, dataShape, interactions, freshness }` — with no `kind`.
> A separate deterministic step maps the intent to a registered archetype.

```
intent = {
  name: "Recipe",
  slice: "recipe",
  dataShape: { id, title, ingredients[], steps[] },
  interactions: ["browse", "filter-by-cuisine", "favorite"],
  freshness: "user-owned",     // vs "remote-snapshot"
};

intent → "crud-list"   // because user-owned + browse + filter
```

Pros:
- LLM has a concrete extraction job, not a yes/no classification
- Deterministic mapping is testable in isolation
- Same intent can target different archetypes as the registry grows
- Easier to add "no archetype matches" → ask user

Cons:
- Schema-agent prompt grows; small models drift on multi-field extraction
- Need a second validator layer for intent shape (more Ajv + manifest work)

Verdict: **best long-term**. Closes F1, F3, F4 cleanly. Cost: real schema
work and prompt engineering.

### Option C — Composable archetype = stack of feature mixins

> No single archetype. Pipeline is built from a set of independent
> "features" — `entity-store`, `crud-ops`, `ajax-fetch`, `filters`,
> `wizard-steps`, `page-router`, … Each feature contributes microtasks +
> manifest entries + emitter overrides. The seed selects the feature set;
> ordering is computed from the dependency graph.

```
spec → features = ["entity-store", "ajax-fetch", "single-card"]
spec → features = ["entity-store", "crud-ops", "list-view", "filters"]
```

Pros:
- Mixes naturally: "todo app with weather sidebar" = `crud-ops` + `ajax-fetch`
- New behaviours = new feature, not a new archetype
- The pipeline is no longer per-archetype — there's one composer

Cons:
- Big rewrite. Manifest, dispatcher, orchestrator, sim-LLM all change shape
- Harder to keep G1 (the same feature set must produce the same byte-tree
  every time, but now feature ordering is a graph computation)
- Storybook stories, test files, and route maps cross-cut multiple features
  — the "one emitter per microtask" invariant gets blurry

Verdict: **most powerful, biggest risk**. Worth doing only if we expect ≥4
archetypes that meaningfully overlap.

---

## 4. Recommended path

Ship **Option A first** (1–2 days of work), measure how often it picks the
right archetype on a small spec corpus, then escalate to **Option B** if
the detector accuracy isn't enough. Defer **Option C** until we have ≥4
archetypes.

Concrete A-shaped delta:

1. Move each archetype into its own module `src/archetypes/<kind>/index.js`
   that exports `{ kind, pipeline, manifestBuilders, emitters, detect, defaultEntity }`.
2. `src/terminology.js` becomes a thin `import * as crudList from "./archetypes/crud-list/index.js"` … and a `registry`.
3. `src/file-manifest.js` and `src/deterministic-emitters.js` read from
   `registry[kind]` instead of their own keyed maps.
4. `entity-schema.schema.json` drops the `kind` enum; validation becomes:
   `kind` must be a registered key, the entity must satisfy the
   archetype's own JSON schema.
5. Sim-LLM walks the registry's `detect()` functions in declaration order;
   first non-zero match wins. No fallback default — unmatched specs
   throw a "no archetype matches '<spec>'; registered: [...]" error.
6. Each archetype owns its `defaultEntity`, so adding an archetype no
   longer needs sim-LLM edits.

Open questions for this delta (please weigh in):

- **Q1.** Do we want `detect()` to return `0…1` (best-match wins) or
  boolean (first-match wins, declaration order)? Boolean is simpler;
  scored is more robust to overlap.
- **Q2.** Should the harness *refuse* to run on an unmatched spec, or
  should it pick the closest archetype with a warning? Refusal is honest;
  fallback is friendlier to the demo workflow.
- **Q3.** When we do move to Option B, should the intent extractor live
  as a *separate* microtask before `entity-schema`, or replace
  `entity-schema` entirely?
- **Q4.** Beyond `kanban` / `recipe` / `wizard`, what specs should we
  add to a regression corpus to gate accuracy?

---

## 5. What this does *not* change

- The pipeline orchestration, repair loop, two-layer validation, and the
  variable-vs-fixed microtask split — those are working and we keep them.
- The 14 (now 16) vendored skills — adding archetypes pulls more skills
  but the loader is already general.
- The byte-stability contract for `build a todo app` — the todo
  pipeline lives in `src/archetypes/crud-list/index.js` after the move,
  but emits the same files in the same order.

---

## 6. Out of scope (for this TRD)

- Full LLM-driven extraction in the seed (Option B's prompt design)
- Routing/multi-page apps
- Server-side rendering or SSG (covered by separate `server-ssr` /
  `server-ssg` skills already vendored upstream but not wired in)
- Theming / i18n beyond the existing `config-slice`

---

## 7. Decision log (to be filled in)

- [ ] Option chosen: A / B / C / hybrid
- [ ] Q1 answered:
- [ ] Q2 answered:
- [ ] Q3 answered:
- [ ] Q4 answered:
