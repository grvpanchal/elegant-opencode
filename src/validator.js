// Two-layer validation for microtask outputs:
//
//   1. JSON-Schema (Ajv) — generic envelope check.
//        • entity-schema microtask uses entity-schema.schema.json
//        • every code-emitting microtask uses files.schema.json (validates
//          that `{ files: { relPath: <string> } }` is well-formed)
//
//   2. Per-microtask manifest — semantic check that the file SET matches the
//      skill's contract for the given entity (required relPaths, structural
//      invariants like "must contain export default"). Lives in file-manifest.js.
//
// Both layers must pass for a microtask output to be considered valid. Repair
// loops merge errors from both layers into a single prompt.

import Ajv from "ajv";
import { validateFiles } from "./file-manifest.js";

// Build a fresh Ajv per call so $id duplicates across runs don't throw. The
// schemas are tiny so compile cost is negligible.
export function validateSchema(schema, data) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const v = ajv.compile(schema);
  const ok = v(data);
  return { ok, errors: v.errors || [] };
}

export function validate({ schema, microtask, entity, data }) {
  const errs = [];
  if (schema) {
    const r = validateSchema(schema, data);
    if (!r.ok) {
      for (const e of r.errors) {
        errs.push({
          instancePath: e.instancePath || "(root)",
          message: `${e.instancePath || "(root)"}: ${e.message}`
        });
      }
    }
  }
  // Manifest validation only applies to code-emitting microtasks (those whose
  // payload is `{ files: {...} }`). Skip for entity-schema (payload is the
  // entity itself).
  if (microtask && microtask !== "entity-schema" && data && data.files) {
    const r = validateFiles(microtask, entity, data);
    if (!r.ok) {
      for (const msg of r.errors) {
        errs.push({ instancePath: "files", message: msg });
      }
    }
  }
  return { ok: errs.length === 0, errors: errs };
}

// Field-level repair prompt. Tells the agent exactly which paths/invariants
// failed and asks it to re-emit a CONFORMANT `{ files: {...} }` map. We do
// NOT echo the previous output back — small models tend to copy-paste it
// rather than fix it, which compounds errors. Instead we just list the
// failures and the original task.
export function repairPrompt(originalUser, errors, _lastOutput) {
  return `${originalUser}

Your previous attempt failed validation. Fix THESE errors and re-emit the FULL JSON object \`{ "files": { "relPath": "<source>", ... } }\`. Do not include any other keys, prose, or markdown.

Errors:
${errors.map((e) => `- ${e.message}`).join("\n")}

Output JSON only.`;
}
