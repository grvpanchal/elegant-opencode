// Simulates a small local model (Qwen3 ~8B / Gemma3 ~27B class) responding
// to each variable microtask. Uses the per-skill deterministic emitter as
// the "ideal" answer (the LLM is prompted to produce skill-conforming output;
// the emitter encodes that exact contract), then injects realistic failure
// modes in early attempts:
//
//   • code fences around JSON (~30%)
//   • stray prose preamble ("Sure! Here's the JSON:") (~25%)
//   • a missing required file (~20%)
//   • truncated content / empty file value (~15%)
//
// The orchestrator's repair loop must reach manifest-valid output in ≤3
// attempts every time. Attempt 3 always returns clean output so the harness
// can measure recovery rate, not a hard-fail rate.
//
// ARCHETYPE DISPATCH
// ──────────────────
// The seed entity-schema microtask receives the user's spec ("build a todo
// app", "build a weather app", …). We classify the spec to one of the known
// canonical entities and return its full record — including `kind` — so the
// orchestrator can pick the right pipeline. The schema-agent prompt in
// production performs the same classification.

import { getTerminology, archetypeOf } from "../src/terminology.js";
import { emitFixed } from "../src/deterministic-emitters.js";

// Canonical entities ---------------------------------------------------------
// One per archetype. The schema-agent in production extracts these same
// fields from a free-text spec; the deterministic stand-in matches by
// keyword.

const TODO_ENTITY = {
  name: "Todo",
  slice: "todo",
  appName: "Todo App",
  projectName: "todo-app",
  kind: "crud-list",
  itemsField: "todoItems",
  currentField: "currentTodoItem",
  operations: ["create", "edit", "update", "toggle", "delete"]
};

const WEATHER_ENTITY = {
  name: "Weather",
  slice: "weather",
  appName: "Weather App",
  projectName: "weather-app",
  kind: "fetch-card",
  queryField: "city",
  queryPlaceholder: "Enter a city…",
  responseFields: ["temperature", "condition", "humidity"]
};

const ENTITY_BY_KEYWORD = [
  { match: /\bweather\b|\bforecast\b|\bclimate\b/i, entity: WEATHER_ENTITY },
  { match: /\btodo\b|\btask\b|\bcomment\b|\bproduct\b|\blist\b/i, entity: TODO_ENTITY }
];

function classifySpec(spec) {
  const text = typeof spec === "string" ? spec : (spec?.spec || "");
  for (const { match, entity } of ENTITY_BY_KEYWORD) {
    if (match.test(text)) return entity;
  }
  return TODO_ENTITY; // back-compat default
}

// Ideal answer for a microtask. For "entity-schema" we return the entity
// itself; for every other variable task we run the per-skill emitter (which
// returns `{ files: {...} }`) — the LLM in production is asked for the
// SAME shape, so this is the canonical reference output.
function ideal(task, entity) {
  if (task === "entity-schema") return entity;
  return emitFixed(task, entity, {});
}

// Inject failure-modes by attempt index.
//   attempt 1: ~80% noisy
//   attempt 2: ~20% noisy
//   attempt 3: clean
function distort(attempt, value, task, seed) {
  if (attempt >= 3) return JSON.stringify(value);
  const rng = mulberry32(seed + attempt * 1009);
  const noiseProb = attempt === 1 ? 0.8 : 0.2;
  if (rng() > noiseProb) return JSON.stringify(value);
  const r = rng();
  let out = JSON.parse(JSON.stringify(value));

  if (task === "entity-schema") {
    // 25%: drop a required field (operations or kind, depending on archetype)
    if (r < 0.25) {
      if (out.operations) delete out.operations;
      else if (out.queryField) delete out.queryField;
    }
    // 25%: wrong slice case
    else if (r < 0.5) out.slice = (out.slice || "x")[0].toUpperCase() + (out.slice || "x").slice(1);
  } else {
    const fileKeys = Object.keys(out.files || {});
    // 20%: drop a required file
    if (r < 0.2 && fileKeys.length > 1) {
      delete out.files[fileKeys[0]];
    }
    // 15%: truncate one file to empty
    else if (r < 0.35 && fileKeys.length) {
      out.files[fileKeys[0]] = "";
    }
    // 15%: add an unexpected file
    else if (r < 0.5) {
      out.files["src/junk.tmp"] = "// stray file";
    }
  }

  let serialized = JSON.stringify(out);
  // 25%: prose preamble
  if (r >= 0.5 && r < 0.75) {
    serialized = `Sure! Here is the JSON:\n${serialized}`;
  }
  // 25%: code fences
  if (r >= 0.75) {
    serialized = "```json\n" + serialized + "\n```";
  }
  return serialized;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a sim-LLM keyed to a particular spec / entity so a single makeSimLLM
// call can drive an entire pipeline run. Pass a `kind` or `spec` in opts to
// pin the archetype.
export function makeSimLLM(seed = 1, opts = {}) {
  let counter = 0;
  const calls = new Map();
  // Cache the entity classification on the first entity-schema call so the
  // remainder of the pipeline uses the same kind.
  let pinnedEntity = opts.entity || null;
  if (opts.kind === "fetch-card") pinnedEntity = WEATHER_ENTITY;
  else if (opts.kind === "crud-list") pinnedEntity = TODO_ENTITY;

  return async function simLLM({ agent, system, user, task }) {
    const attempts = (calls.get(task) || 0) + 1;
    calls.set(task, attempts);
    counter++;
    const kind = archetypeOf(pinnedEntity || {});
    if (!getTerminology(kind, task)) {
      throw new Error(`sim-llm: no terminology entry for task "${task}" in archetype "${kind}"`);
    }
    if (task === "entity-schema") {
      pinnedEntity = pinnedEntity || classifySpec(opts.spec || user || system || "");
      return distort(attempts, ideal(task, pinnedEntity), task, seed + counter);
    }
    if (!pinnedEntity) {
      // Defensive: someone called sim-llm for a non-seed task without the
      // seed running first. Fall back to the todo entity.
      pinnedEntity = TODO_ENTITY;
    }
    return distort(attempts, ideal(task, pinnedEntity), task, seed + counter);
  };
}

export const ENTITIES = { todo: TODO_ENTITY, weather: WEATHER_ENTITY };
