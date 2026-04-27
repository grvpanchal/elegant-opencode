// Deterministic emitter dispatcher.
//
// Each microtask in the pipeline maps to exactly one per-skill emitter
// module under `src/emitters/`. The emitter functions encode the SKILL.md
// "Code Patterns" + "Key Principles" as JS code generators that take the
// entity schema and return a `{ files: { relPath: content } }` map.
//
// "fixed" microtasks: production runs the emitter directly. Zero LLM tokens,
// zero variability — the skill IS the source of truth for the structure.
//
// "variable" microtasks: production calls an LLM agent (see agents/*.md).
// In sim-llm we use the same emitter as a deterministic stand-in — the LLM
// is asked to produce skill-conforming output, so the emitter's output is
// the canonical reference of what valid output looks like.

import { TERMINOLOGY, isVariable } from "./terminology.js";

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

// Map microtask name → emitter module.
// `entity-schema` produces no files (it's the seed input).
const EMITTERS = {
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
};

// Run a fixed microtask. Returns `{ files: {...} }`.
export function emitFixed(microtask, entity, _upstream) {
  if (microtask === "entity-schema") return { files: {} };
  const mod = EMITTERS[microtask];
  if (!mod) throw new Error(`No emitter registered for microtask "${microtask}"`);
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
// based on the terminology.
export function emit(microtask, entity, upstream) {
  return isVariable(microtask)
    ? emitVariableSimulated(microtask, entity, upstream)
    : emitFixed(microtask, entity, upstream);
}

export { TERMINOLOGY };
