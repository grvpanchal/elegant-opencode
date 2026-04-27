// Materialise the pipeline's microtask outputs to disk.
//
// Every microtask returns `{ files: { relPath: content } }`. The code emitter
// merges those maps in pipeline order (later writes win on collision — but the
// pipeline is designed so that no two microtasks own the same relPath) and
// writes each file verbatim to the destination directory.
//
// Determinism comes from the emitters / agents themselves: each microtask is
// bound to a SKILL.md whose Code Patterns + Key Principles fully constrain the
// output for a given entity schema. The code emitter is just a faithful
// pipe — it never invents, copies, or mutates content.

import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";

export async function emit({ result, directory = process.cwd() }) {
  const merged = mergeFiles(result);
  const written = [];
  for (const relPath of Object.keys(merged).sort()) {
    const content = merged[relPath];
    if (typeof content !== "string") {
      throw new Error(
        `code-emitter: file "${relPath}" is not a string (got ${typeof content}). ` +
          `Every microtask must return { files: { relPath: <string> } }.`
      );
    }
    const dest = join(directory, relPath);
    await fs.mkdir(dirname(dest), { recursive: true });
    await fs.writeFile(dest, content, "utf8");
    written.push(relPath);
  }
  return written;
}

// Merge every microtask's `{ files: {...} }` map into a single relPath→content
// table. Skips microtasks that emit nothing (e.g. entity-schema).
export function mergeFiles(result) {
  const merged = {};
  for (const [task, value] of Object.entries(result || {})) {
    if (!value || typeof value !== "object") continue;
    const files = value.files;
    if (!files || typeof files !== "object") continue;
    for (const [relPath, content] of Object.entries(files)) {
      if (Object.prototype.hasOwnProperty.call(merged, relPath)) {
        // A collision is a pipeline bug — every relPath should be owned by
        // exactly one microtask. Surface it loudly instead of silently
        // overwriting.
        throw new Error(
          `code-emitter: relPath "${relPath}" emitted by multiple microtasks ` +
            `(later: "${task}"). Each file must be owned by exactly one skill.`
        );
      }
      merged[relPath] = content;
    }
  }
  return merged;
}
