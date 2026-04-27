// Per-microtask context builder. Every subagent receives EXACTLY:
//
//   1. role + invariant rules (system)
//   2. compacted SKILL.md slice (Key Principles + Code Patterns)
//   3. a concrete in-repo exemplar
//   4. the EXACT relPath set the agent must emit (from file-manifest.js)
//   5. structural invariants the emitter output must satisfy
//   6. the entity schema + dependency outputs (only the ones declared in
//      `dependsOn`, never the whole upstream tree)
//   7. the response JSON-Schema (envelope: `{ files: { relPath: source } }`)
//
// No conversation history. No global codebase context. Tight context = small
// models behave like big models. The structure is IMPOSED by the skill +
// manifest; the agent never chooses paths or invariants.

import { TERMINOLOGY } from "./terminology.js";
import { loadSkill } from "./skills-loader.js";
import { exemplarFor } from "./exemplars.js";
import { manifestFor } from "./file-manifest.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = join(__dirname, "schemas");

function loadSchema(file) {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, file), "utf8"));
}

const INVARIANTS = `Universal Frontend Architecture invariants:
- UI: atoms < molecules < organisms < templates. Only containers (server-container) touch state.
- State: action types in UPPER_SNAKE_CASE; reducers pure switch/case; selectors compose; classic redux (createStore + combineReducers).
- Naming: PascalCase components/services, camelCase fields/slices, UPPER_SNAKE_CASE action types.
- Output MUST be a single JSON object \`{ "files": { "relPath": "<source>" } }\` — no prose, no fences.`;

export function buildContext({ task, entitySchema, upstream }) {
  const meta = TERMINOLOGY[task];
  if (!meta) throw new Error(`Unknown microtask: ${task}`);

  const skill = meta.skill ? loadSkill(meta.skill) : null;
  const exemplar = exemplarFor(task);
  const schema = loadSchema(meta.schema);
  const manifest =
    task === "entity-schema"
      ? null
      : manifestFor(task, entitySchema || {});

  const upstreamSlice = {};
  for (const dep of meta.dependsOn) {
    if (upstream[dep] !== undefined) upstreamSlice[dep] = upstream[dep];
  }

  const manifestBlock = manifest
    ? [
        `\n# Required Files\nYou MUST emit EXACTLY these relPaths — no more, no fewer:`,
        manifest.paths.map((p) => `  - ${p}`).join("\n"),
        manifest.invariants.length
          ? "\n# Structural Invariants\n" +
            manifest.invariants
              .map(
                (i) =>
                  `  - ${i.path} must contain: ${(i.mustContain || [])
                    .map((s) => `"${s}"`)
                    .join(", ")}`
              )
              .join("\n")
          : ""
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const system = [
    `You are the "${task}" microtask agent in the Elegant universal-frontend pipeline.`,
    `Layer: ${meta.layer}. Variability: ${meta.variability}.`,
    INVARIANTS,
    skill ? `\n# Skill (${meta.skill})\n${skill}` : "",
    exemplar ? `\n# Exemplar\n\`\`\`\n${exemplar}\n\`\`\`` : "",
    manifestBlock,
    `\n# Response Schema\n${JSON.stringify(schema, null, 2)}`
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    `# Entity\n${JSON.stringify(entitySchema, null, 2)}`,
    Object.keys(upstreamSlice).length
      ? `# Upstream\n${JSON.stringify(summariseUpstream(upstreamSlice), null, 2)}`
      : "",
    `# Task\nProduce the JSON object for "${task}". Validate mentally against the schema and the Required Files list before responding. Output JSON only.`
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user, schema, agent: meta.agent };
}

// Upstream payloads can be huge `{ files: {...} }` blobs. Don't pass full
// content to the agent — it doesn't need to read the source. Send just the
// list of relPaths so it can reference them.
function summariseUpstream(slice) {
  const out = {};
  for (const [k, v] of Object.entries(slice)) {
    if (v && typeof v === "object" && v.files && typeof v.files === "object") {
      out[k] = { files: Object.keys(v.files).sort() };
    } else {
      out[k] = v;
    }
  }
  return out;
}
