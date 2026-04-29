// Universal Frontend Architecture terminology, mirrored from
//   https://elegantfrontend.training/blog/universal-frontend-architecture
// and the SKILL.md files at grvpanchal/elegant/skills/.
//
// THE CONTRACT
// ─────────────
// Every microtask is bound to ONE skill. The skill defines the pattern; the
// microtask applies that pattern to the entity schema. The microtask emits a
// { files: { relPath: content } } map — actual source code, never JSON
// metadata. The code-emitter writes those files to disk verbatim.
//
//  • fixed microtasks  — pure JS code generators. They encode the skill's
//    Key Principles + Code Patterns directly as functions of the entity
//    schema. Zero LLM tokens, zero drift.
//  • variable microtasks — LLM-backed. The agent receives the SKILL.md
//    slice + an in-repo exemplar + the entity schema and emits the same
//    { files: { relPath: content } } shape. The schema gate validates the
//    file SET (required relPaths) and structural invariants (must export
//    default, must import the right symbols).
//
// ARCHETYPES
// ──────────
// Different application archetypes (a CRUD list, an ajax fetch+render card,
// a wizard, a dashboard, …) reuse the universal architecture but assemble
// different microtasks in different orders. The current archetypes:
//
//   • "crud-list"  — list-with-filters CRUD app (Todo / Comment / Product …).
//                    Pipeline includes filters-slice; state-actions encode
//                    create/edit/update/toggle/delete; ui-molecule emits the
//                    AddForm + FilterGroup + Items composition.
//
//   • "fetch-card" — query-and-display ajax app (Weather / Stock / Crypto …).
//                    Pipeline replaces filters-slice with ajax-middleware;
//                    state-actions encode request/receive/fail; ui-molecule
//                    emits the QueryForm + display molecule.
//
// The seed `entity-schema` microtask declares `kind` (defaulting to
// "crud-list" for back-compat); the orchestrator picks the pipeline off
// that kind. Each archetype owns its own:
//   - PIPELINE order
//   - per-microtask metadata (skill / agent / variability / dependencies)
//   - file manifest (see file-manifest.js)
//   - emitters (see deterministic-emitters.js)

// ── microtask metadata, archetype-keyed ──────────────────────────────────
// For each archetype we declare the full microtask map. Most entries are
// shared between archetypes; differences live in the archetype that needs
// them. `getTerminology(kind, task)` looks up the entry for a given
// archetype, falling back to the "crud-list" default when an archetype
// doesn't override.

const SHARED = {
  "entity-schema": {
    layer: "meta", skill: null, agent: "schema-agent",
    variability: "variable",
    schema: "entity-schema.schema.json",
    dependsOn: []
  },
  "app-shell": {
    layer: "server", skill: "server-app-shell", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },
  "ui-theme": {
    layer: "ui", skill: "ui-theme", agent: null,
    variability: "fixed",
    dependsOn: []
  },
  "state-types": {
    layer: "state", skill: "state-actions", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },
  "state-initial": {
    layer: "state", skill: "state-reducer", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },
  "state-actions": {
    layer: "state", skill: "state-actions", agent: null,
    variability: "fixed",
    dependsOn: ["state-types"]
  },
  "state-reducer": {
    layer: "state", skill: "state-reducer", agent: null,
    variability: "fixed",
    dependsOn: ["state-initial", "state-types"]
  },
  "state-selectors": {
    layer: "state", skill: "state-selectors", agent: "selectors-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["state-reducer", "entity-schema"]
  },
  "config-slice": {
    layer: "state", skill: "state-crud", agent: null,
    variability: "fixed",
    dependsOn: []
  },
  "atomic-provider": {
    layer: "server", skill: "server-app-shell", agent: null,
    variability: "fixed",
    dependsOn: ["state-store"]
  },
  "ui-base-atoms": {
    layer: "ui", skill: "ui-atom", agent: null,
    variability: "fixed",
    dependsOn: ["ui-theme"]
  },
  "ui-context-atoms": {
    layer: "ui", skill: "ui-atom", agent: null,
    variability: "fixed",
    dependsOn: ["ui-base-atoms", "atomic-provider"]
  },
  "ui-domain-atom": {
    layer: "ui", skill: "ui-atom", agent: "atom-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["entity-schema", "ui-base-atoms", "ui-context-atoms"]
  },
  "ui-skeleton": {
    layer: "ui", skill: "ui-skeleton", agent: null,
    variability: "fixed",
    dependsOn: []
  },
  "ui-layout": {
    layer: "ui", skill: "ui-template", agent: null,
    variability: "fixed",
    dependsOn: []
  },
  "ui-molecule": {
    layer: "ui", skill: "ui-molecule", agent: "molecule-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-domain-atom", "ui-base-atoms", "ui-context-atoms", "entity-schema"]
  },
  "ui-organism": {
    layer: "ui", skill: "ui-organism", agent: "organism-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-molecule", "ui-skeleton", "state-selectors", "entity-schema"]
  },
  "container": {
    layer: "server", skill: "server-container", agent: "container-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-organism", "state-selectors", "state-actions", "entity-schema"]
  },
  "page": {
    layer: "server", skill: "server-page", agent: null,
    variability: "fixed",
    dependsOn: ["container", "ui-layout"]
  }
};

// crud-list archetype — list-with-filters CRUD app (Todo / Comment / …).
// Adds filters-slice; state-store combines reducer + filters + config.
const CRUD_LIST = {
  ...SHARED,
  "filters-slice": {
    layer: "state", skill: "state-crud", agent: null,
    variability: "fixed",
    dependsOn: []
  },
  "state-helper": {
    layer: "state", skill: "state-saga", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },
  "state-operations": {
    layer: "state", skill: "state-saga", agent: null,
    variability: "fixed",
    dependsOn: ["state-actions", "state-helper", "utils-api"]
  },
  "state-root-sagas": {
    layer: "state", skill: "state-saga", agent: null,
    variability: "fixed",
    dependsOn: ["state-operations"]
  },
  "utils-api": {
    layer: "server", skill: "server-api", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },
  "state-store": {
    layer: "state", skill: "state-store", agent: null,
    variability: "fixed",
    dependsOn: ["state-reducer", "filters-slice", "config-slice", "state-root-sagas"]
  }
};

// fetch-card archetype — query-and-display ajax app (Weather / Stock / …).
// Replaces filters-slice with ajax-middleware; state-store combines reducer +
// config + middleware.
const FETCH_CARD = {
  ...SHARED,
  "ajax-middleware": {
    layer: "state", skill: "state-middleware", agent: null,
    variability: "fixed",
    dependsOn: ["state-actions"]
  },
  "state-store": {
    layer: "state", skill: "state-store", agent: null,
    variability: "fixed",
    dependsOn: ["state-reducer", "ajax-middleware", "config-slice"]
  }
};

const ARCHETYPES = {
  "crud-list": {
    terminology: CRUD_LIST,
    pipeline: [
      "entity-schema",
      "ui-theme",
      "app-shell",
      "state-types",
      "state-initial",
      "state-actions",
      "state-helper",
      "state-reducer",
      "state-selectors",
      "filters-slice",
      "config-slice",
      "utils-api",
      "state-operations",
      "state-root-sagas",
      "state-store",
      "atomic-provider",
      "ui-base-atoms",
      "ui-context-atoms",
      "ui-domain-atom",
      "ui-skeleton",
      "ui-layout",
      "ui-molecule",
      "ui-organism",
      "container",
      "page"
    ]
  },
  "fetch-card": {
    terminology: FETCH_CARD,
    pipeline: [
      "entity-schema",
      "ui-theme",
      "app-shell",
      "state-types",
      "state-initial",
      "state-actions",
      "state-reducer",
      "state-selectors",
      "ajax-middleware",
      "config-slice",
      "state-store",
      "atomic-provider",
      "ui-base-atoms",
      "ui-context-atoms",
      "ui-domain-atom",
      "ui-skeleton",
      "ui-layout",
      "ui-molecule",
      "ui-organism",
      "container",
      "page"
    ]
  }
};

export const DEFAULT_ARCHETYPE = "crud-list";

export function archetypeOf(entity) {
  const k = entity?.kind;
  if (k && ARCHETYPES[k]) return k;
  return DEFAULT_ARCHETYPE;
}

export function getPipeline(kind = DEFAULT_ARCHETYPE) {
  const a = ARCHETYPES[kind];
  if (!a) throw new Error(`Unknown archetype "${kind}". Known: ${Object.keys(ARCHETYPES).join(", ")}`);
  return a.pipeline;
}

export function getTerminology(kind = DEFAULT_ARCHETYPE, task) {
  const a = ARCHETYPES[kind] || ARCHETYPES[DEFAULT_ARCHETYPE];
  if (task) return a.terminology[task] || ARCHETYPES[DEFAULT_ARCHETYPE].terminology[task];
  return a.terminology;
}

export function isVariable(task, kind = DEFAULT_ARCHETYPE) {
  return getTerminology(kind, task)?.variability === "variable";
}

export function listArchetypes() {
  return Object.keys(ARCHETYPES);
}

// ── back-compat exports ─────────────────────────────────────────────────
// Existing call-sites import TERMINOLOGY and PIPELINE directly. Keep those
// pointing at the crud-list archetype so todo demos stay byte-identical.

export const TERMINOLOGY = CRUD_LIST;
export const PIPELINE = ARCHETYPES["crud-list"].pipeline;
