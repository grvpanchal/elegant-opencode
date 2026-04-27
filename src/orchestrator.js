// Orchestrates the full pipeline. Pure JS — no opencode runtime needed for
// determinism testing. The opencode plugin (src/index.js) wraps this and
// dispatches the variable microtasks to subagents via the Task tool.
//
// Universal contract: every microtask returns either
//   • the entity schema object (only for the seed "entity-schema" task), or
//   • `{ files: { relPath: <string source> } }` for every other task.
// Two-layer validation (Ajv + per-microtask file manifest) gates every step.

import { PIPELINE, TERMINOLOGY, isVariable } from "./terminology.js";
import { buildContext } from "./context-builder.js";
import { emitFixed } from "./deterministic-emitters.js";
import { validate, repairPrompt } from "./validator.js";

export async function runPipeline({ entitySpec, llm, onTrace = () => {} }) {
  // 1. seed entity schema (variable, but cheap)
  const entityCtx = buildContext({
    task: "entity-schema",
    entitySchema: entitySpec,
    upstream: {}
  });
  const entitySchema = await callLLMWithRepair({
    ctx: entityCtx,
    llm,
    onTrace,
    task: "entity-schema",
    entity: null
  });
  const upstream = { "entity-schema": entitySchema };

  // 2. iterate the pipeline in topological order
  for (const task of PIPELINE) {
    if (task === "entity-schema") continue;
    const t0 = Date.now();
    let result;
    if (isVariable(task)) {
      const ctx = buildContext({ task, entitySchema, upstream });
      result = await callLLMWithRepair({
        ctx,
        llm,
        onTrace,
        task,
        entity: entitySchema
      });
    } else {
      result = emitFixed(task, entitySchema, upstream);
    }
    upstream[task] = result;
    onTrace({
      task,
      ms: Date.now() - t0,
      via: isVariable(task) ? `llm:${TERMINOLOGY[task].agent}` : "deterministic",
      ok: true
    });
  }
  return upstream;
}

async function callLLMWithRepair({ ctx, llm, onTrace, task, entity, maxAttempts = 3 }) {
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const userMsg =
      attempt === 1
        ? ctx.user
        : repairPrompt(ctx.user, last.errors, last.output);
    const raw = await llm({
      agent: ctx.agent,
      system: ctx.system,
      user: userMsg,
      task
    });
    const parsed = safeParse(raw);
    if (!parsed.ok) {
      last = {
        errors: [{ instancePath: "(root)", message: `Invalid JSON: ${parsed.error}` }],
        output: raw
      };
      onTrace({ task, attempt, ok: false, reason: "invalid-json" });
      continue;
    }
    const v = validate({
      schema: ctx.schema,
      microtask: task,
      entity,
      data: parsed.value
    });
    if (v.ok) {
      onTrace({ task, attempt, ok: true });
      return parsed.value;
    }
    last = { errors: v.errors, output: parsed.value };
    onTrace({
      task,
      attempt,
      ok: false,
      errors: v.errors.map((e) => e.message).slice(0, 5)
    });
  }
  throw new Error(
    `Microtask "${task}" failed validation after ${maxAttempts} attempts: ` +
      JSON.stringify(last.errors.slice(0, 5))
  );
}

function safeParse(s) {
  if (typeof s !== "string") return { ok: true, value: s };
  // Strip code fences and stray prose preamble that small models inject.
  let cleaned = s.trim();
  // Drop everything before the first "{" if there's a prose preamble.
  const firstBrace = cleaned.indexOf("{");
  const firstFence = cleaned.indexOf("```");
  if (firstFence >= 0 && (firstBrace < 0 || firstFence < firstBrace)) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  } else if (firstBrace > 0) {
    cleaned = cleaned.slice(firstBrace);
  }
  // Trim trailing fence if still present.
  cleaned = cleaned.replace(/```\s*$/i, "").trim();
  try {
    return { ok: true, value: JSON.parse(cleaned) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
