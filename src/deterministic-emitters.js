// Deterministic emitter dispatcher.
//
// Each microtask in the pipeline maps to exactly one per-skill emitter
// module. The emitter functions encode the SKILL.md "Code Patterns" + "Key
// Principles" as JS code generators that take the entity schema and return
// a `{ files: { relPath: content } }` map.
//
// "fixed" microtasks: production runs the emitter directly. Zero LLM tokens,
// zero variability — the skill IS the source of truth for the structure.
//
// "variable" microtasks: production calls an LLM agent (see agents/*.md).
// In sim-llm we use the same emitter as a deterministic stand-in — the LLM
// is asked to produce skill-conforming output, so the emitter's output is
// the canonical reference of what valid output looks like.
//
// ARCHETYPE DISPATCH
// ──────────────────
// Each archetype maps a microtask name to its emitter module. crud-list is
// the default registry; fetch-card overrides the entries that differ
// (state-types/actions/reducer/store, ajax-middleware, ui-domain-atom,
// ui-molecule, ui-organism, container, page) and falls back to crud-list
// for archetype-agnostic ones (app-shell, ui-theme, ui-base-atoms, etc.).

import { archetypeOf, isVariable } from "./terminology.js";

import * as appShell        from "./emitters/app-shell.js";
import * as uiTheme         from "./emitters/ui-theme.js";
import * as stateTypes      from "./emitters/state-types.js";
import * as stateInitial    from "./emitters/state-initial.js";
import * as stateActions    from "./emitters/state-actions.js";
import * as stateReducer    from "./emitters/state-reducer.js";
import * as stateSelectors  from "./emitters/state-selectors.js";
import * as filtersSlice    from "./emitters/filters-slice.js";
import * as configSlice     from "./emitters/config-slice.js";
import * as stateStore      from "./emitters/state-store.js";
import * as atomicProvider  from "./emitters/atomic-provider.js";
import * as uiBaseAtoms     from "./emitters/ui-base-atoms.js";
import * as uiContextAtoms  from "./emitters/ui-context-atoms.js";
import * as uiDomainAtom    from "./emitters/ui-domain-atom.js";
import * as uiSkeleton      from "./emitters/ui-skeleton.js";
import * as uiLayout        from "./emitters/ui-layout.js";
import * as uiMolecule      from "./emitters/ui-molecule.js";
import * as uiOrganism      from "./emitters/ui-organism.js";
import * as container       from "./emitters/container.js";
import * as page            from "./emitters/page.js";
import * as stateOperations from "./emitters/state-operations.js";
import * as stateHelper     from "./emitters/state-helper.js";
import * as stateRootSagas  from "./emitters/state-root-sagas.js";
import * as utilsApi        from "./emitters/utils-api.js";

// fetch-card overrides
import * as fcStateTypes    from "./emitters/fetch-card/state-types.js";
import * as fcStateInitial  from "./emitters/fetch-card/state-initial.js";
import * as fcStateActions  from "./emitters/fetch-card/state-actions.js";
import * as fcStateReducer  from "./emitters/fetch-card/state-reducer.js";
import * as fcStateStore    from "./emitters/fetch-card/state-store.js";
import * as fcStateSelectors from "./emitters/fetch-card/state-selectors.js";
import * as fcAjaxMiddleware from "./emitters/fetch-card/ajax-middleware.js";
import * as fcUiDomainAtom  from "./emitters/fetch-card/ui-domain-atom.js";
import * as fcUiMolecule    from "./emitters/fetch-card/ui-molecule.js";
import * as fcUiOrganism    from "./emitters/fetch-card/ui-organism.js";
import * as fcContainer     from "./emitters/fetch-card/container.js";
import * as fcPage          from "./emitters/fetch-card/page.js";

// Default crud-list registry.
const CRUD_LIST_EMITTERS = {
  "app-shell":        appShell,
  "ui-theme":         uiTheme,
  "state-types":      stateTypes,
  "state-initial":    stateInitial,
  "state-actions":    stateActions,
  "state-reducer":    stateReducer,
  "state-selectors":  stateSelectors,
  "filters-slice":    filtersSlice,
  "config-slice":     configSlice,
  "state-store":      stateStore,
  "atomic-provider":  atomicProvider,
  "ui-base-atoms":    uiBaseAtoms,
  "ui-context-atoms": uiContextAtoms,
  "ui-domain-atom":   uiDomainAtom,
  "ui-skeleton":      uiSkeleton,
  "ui-layout":        uiLayout,
  "ui-molecule":      uiMolecule,
  "ui-organism":      uiOrganism,
  "container":        container,
  "page":             page,
  "state-helper":     stateHelper,
  "state-operations": stateOperations,
  "state-root-sagas": stateRootSagas,
  "utils-api":        utilsApi
};

// fetch-card overrides; missing keys fall back to crud-list.
const FETCH_CARD_OVERRIDES = {
  "state-types":      fcStateTypes,
  "state-initial":    fcStateInitial,
  "state-actions":    fcStateActions,
  "state-reducer":    fcStateReducer,
  "state-store":      fcStateStore,
  "state-selectors":  fcStateSelectors,
  "ajax-middleware":  fcAjaxMiddleware,
  "ui-domain-atom":   fcUiDomainAtom,
  "ui-molecule":      fcUiMolecule,
  "ui-organism":      fcUiOrganism,
  "container":        fcContainer,
  "page":             fcPage
};

const ARCHETYPE_EMITTERS = {
  "crud-list":  CRUD_LIST_EMITTERS,
  "fetch-card": { ...CRUD_LIST_EMITTERS, ...FETCH_CARD_OVERRIDES }
};

function emitterFor(microtask, entity) {
  const kind = archetypeOf(entity);
  const reg = ARCHETYPE_EMITTERS[kind] || CRUD_LIST_EMITTERS;
  return reg[microtask] || CRUD_LIST_EMITTERS[microtask];
}

// Run a fixed microtask. Returns `{ files: {...} }`.
export function emitFixed(microtask, entity, _upstream) {
  if (microtask === "entity-schema") return { files: {} };
  const mod = emitterFor(microtask, entity);
  if (!mod) throw new Error(`No emitter registered for microtask "${microtask}" in archetype "${archetypeOf(entity)}"`);
  return { files: mod.emit(entity) };
}

// Run a variable microtask in deterministic stand-in mode (sim-llm). The
// SAME emitter is used — the LLM agent in production is expected to produce
// skill-conforming output, and the emitter output IS that conforming output
// for the canonical entity. Schema validation in the orchestrator catches
// any agent drift.
export function emitVariableSimulated(microtask, entity, upstream) {
  return emitFixed(microtask, entity, upstream);
}

// Universal entry point used by the orchestrator. Picks fixed vs variable
// based on the terminology and the entity's archetype kind.
export function emit(microtask, entity, upstream) {
  const kind = archetypeOf(entity);
  return isVariable(microtask, kind)
    ? emitVariableSimulated(microtask, entity, upstream)
    : emitFixed(microtask, entity, upstream);
}
