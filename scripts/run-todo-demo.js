// Reproducible demo: build a todo app, write the project to ./demo-output/,
// dump the microtask trace to examples/todo-trace.json.
import { runPipeline } from "../src/orchestrator.js";
import { makeSimLLM } from "../test/sim-llm.js";
import { emit } from "../src/code-emitter.js";
import { rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "demo-output");
const EXAMPLES = join(process.cwd(), "examples");
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(EXAMPLES, { recursive: true });

const trace = [];
const result = await runPipeline({
  entitySpec: { spec: "build a todo app" },
  llm: makeSimLLM(42),
  onTrace: (t) => trace.push(t)
});
const files = await emit({ result, directory: OUT });

writeFileSync(
  join(EXAMPLES, "todo-trace.json"),
  JSON.stringify({ entity: result["entity-schema"], trace, files }, null, 2)
);
console.log(`Wrote ${files.length} files to ${OUT}`);
console.log(`Trace saved to examples/todo-trace.json`);
