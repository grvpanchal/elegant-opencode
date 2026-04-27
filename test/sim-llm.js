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

import { TERMINOLOGY } from "../src/terminology.js";
import { emitFixed } from "../src/deterministic-emitters.js";

// The canonical entity for the "build a todo app" spec. Mirrors what the
// schema-agent would derive from the user's plain-English prompt.
const TODO_ENTITY = {
  name: "Todo",
  slice: "todo",
  appName: "Todo App",
  projectName: "todo-app",
  itemsField: "todoItems",
  currentField: "currentTodoItem",
  operations: ["create", "edit", "update", "toggle", "delete"]
};

// Ideal answer for a microtask. For "entity-schema" we return the entity
// itself; for every other variable task we run the per-skill emitter (which
// returns `{ files: {...} }`) — the LLM in production is asked for the
// SAME shape, so this is the canonical reference output.
function ideal(task) {
  if (task === "entity-schema") return TODO_ENTITY;
  return emitFixed(task, TODO_ENTITY, {});
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
    // 25%: drop a required field
    if (r < 0.25) delete out.operations;
    // 25%: wrong slice case
    else if (r < 0.5) out.slice = "Todo";
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

export function makeSimLLM(seed = 1) {
  let counter = 0;
  const calls = new Map();
  return async function simLLM({ agent, system, user, task }) {
    const attempts = (calls.get(task) || 0) + 1;
    calls.set(task, attempts);
    counter++;
    if (!TERMINOLOGY[task]) {
      throw new Error(`sim-llm: no terminology entry for task "${task}"`);
    }
    const value = ideal(task);
    return distort(attempts, value, task, seed + counter);
  };
}
