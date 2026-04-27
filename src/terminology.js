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
// The structure is therefore IMPOSED BY THE SKILLS, not by any template
// fixture. The chota-react-redux template is one valid output of the
// pipeline because it's the reference embodiment of the same skills.

export const TERMINOLOGY = {
  // ── meta seed ────────────────────────────────────────────────
  "entity-schema": {
    layer: "meta", skill: null, agent: "schema-agent",
    variability: "variable",
    schema: "entity-schema.schema.json",
    dependsOn: []
  },

  // ── app shell (server-app-shell skill) ───────────────────────
  // Cached HTML/CSS/JS skeleton: index.html, src/index.jsx, App.jsx,
  // setupTests.js, vite.config.js, package.json, .gitignore, .storybook/*
  "app-shell": {
    layer: "server", skill: "server-app-shell", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },

  // ── ui-theme skill ───────────────────────────────────────────
  "ui-theme": {
    layer: "ui", skill: "ui-theme", agent: null,
    variability: "fixed",
    dependsOn: []
  },

  // ── state-actions skill: type constants ──────────────────────
  "state-types": {
    layer: "state", skill: "state-actions", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },

  // ── state-reducer skill: initial state ───────────────────────
  "state-initial": {
    layer: "state", skill: "state-reducer", agent: null,
    variability: "fixed",
    dependsOn: ["entity-schema"]
  },

  // ── state-actions skill: action creators ─────────────────────
  "state-actions": {
    layer: "state", skill: "state-actions", agent: null,
    variability: "fixed",
    dependsOn: ["state-types"]
  },

  // ── state-reducer skill: switch/case reducer ─────────────────
  "state-reducer": {
    layer: "state", skill: "state-reducer", agent: null,
    variability: "fixed",
    dependsOn: ["state-initial", "state-types"]
  },

  // ── state-selectors skill ────────────────────────────────────
  // Variable: filter/sort/derive logic depends on entity semantics.
  "state-selectors": {
    layer: "state", skill: "state-selectors", agent: "selectors-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["state-reducer", "entity-schema"]
  },

  // ── filters slice (state-crud skill) ─────────────────────────
  // Visibility filter slice — same pattern for any list-with-filters app.
  "filters-slice": {
    layer: "state", skill: "state-crud", agent: null,
    variability: "fixed",
    dependsOn: []
  },

  // ── config slice (state-crud skill) ──────────────────────────
  // Theme/lang/name config — same pattern in every app.
  "config-slice": {
    layer: "state", skill: "state-crud", agent: null,
    variability: "fixed",
    dependsOn: []
  },

  // ── state-store skill ────────────────────────────────────────
  // createStore + combineReducers + Provider-wired root.
  "state-store": {
    layer: "state", skill: "state-store", agent: null,
    variability: "fixed",
    dependsOn: ["state-reducer", "filters-slice", "config-slice"]
  },

  // ── atomic-provider (server-app-shell skill) ─────────────────
  "atomic-provider": {
    layer: "server", skill: "server-app-shell", agent: null,
    variability: "fixed",
    dependsOn: ["state-store"]
  },

  // ── ui-atom skill: framework atoms (Button, Input, Image, Loader) ─
  // These four atoms are the universal "primitives" any feature needs.
  // The pattern is fully fixed by the ui-atom skill.
  "ui-base-atoms": {
    layer: "ui", skill: "ui-atom", agent: null,
    variability: "fixed",
    dependsOn: ["ui-theme"]
  },

  // ── ui-atom skill: theme-aware atoms (IconButton, Alert, Link) ─
  // These atoms read the AtomicProvider context. Pattern is fixed.
  "ui-context-atoms": {
    layer: "ui", skill: "ui-atom", agent: null,
    variability: "fixed",
    dependsOn: ["ui-base-atoms", "atomic-provider"]
  },

  // ── ui-atom skill: domain atom (entity-specific item view) ───
  // Variable — the JSX depends on entity fields.
  "ui-domain-atom": {
    layer: "ui", skill: "ui-atom", agent: "atom-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["entity-schema", "ui-base-atoms", "ui-context-atoms"]
  },

  // ── ui-skeleton skill ────────────────────────────────────────
  "ui-skeleton": {
    layer: "ui", skill: "ui-skeleton", agent: null,
    variability: "fixed",
    dependsOn: []
  },

  // ── ui-template skill: page Layout shell ─────────────────────
  "ui-layout": {
    layer: "ui", skill: "ui-template", agent: null,
    variability: "fixed",
    dependsOn: []
  },

  // ── ui-molecule skill ────────────────────────────────────────
  // Variable — composition of atoms with entity-specific form/list logic.
  "ui-molecule": {
    layer: "ui", skill: "ui-molecule", agent: "molecule-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-domain-atom", "ui-base-atoms", "ui-context-atoms", "entity-schema"]
  },

  // ── ui-organism skill ────────────────────────────────────────
  // Variable — handles loading/error/empty/ready states for each section.
  "ui-organism": {
    layer: "ui", skill: "ui-organism", agent: "organism-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-molecule", "ui-skeleton", "state-selectors", "entity-schema"]
  },

  // ── server-container skill ───────────────────────────────────
  // Variable — wires useSelector/useDispatch to organism props/events.
  "container": {
    layer: "server", skill: "server-container", agent: "container-agent",
    variability: "variable",
    schema: "files.schema.json",
    dependsOn: ["ui-organism", "state-selectors", "state-actions", "entity-schema"]
  },

  // ── server-page skill ────────────────────────────────────────
  // Fixed — page composes containers inside the layout template.
  "page": {
    layer: "server", skill: "server-page", agent: null,
    variability: "fixed",
    dependsOn: ["container", "ui-layout"]
  }
};

// Topological order — every microtask appears AFTER its dependencies.
export const PIPELINE = [
  "entity-schema",
  "ui-theme",
  "app-shell",
  "state-types",
  "state-initial",
  "state-actions",
  "state-reducer",
  "state-selectors",
  "filters-slice",
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
];

export function isVariable(name) {
  return TERMINOLOGY[name]?.variability === "variable";
}
