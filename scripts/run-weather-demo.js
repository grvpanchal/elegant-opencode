// Reproducible demo: build a weather app, write the project to ./weather-output/,
// dump the microtask trace to examples/weather-trace.json.
//
// Same orchestrator + same skills + same emitters as the todo demo — only
// the seed entity-schema's `kind` flips ("fetch-card" instead of
// "crud-list"), causing the orchestrator to select a different pipeline
// (ajax-middleware in place of filters-slice) and the deterministic emitter
// dispatcher to use the fetch-card emitter modules.
import { runPipeline } from "../src/orchestrator.js";
import { makeSimLLM } from "../test/sim-llm.js";
import { emit } from "../src/code-emitter.js";
import { rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "weather-output");
const EXAMPLES = join(process.cwd(), "examples");
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(EXAMPLES, { recursive: true });

const trace = [];
const result = await runPipeline({
  entitySpec: { spec: "build a weather app" },
  llm: makeSimLLM(42, { spec: "build a weather app" }),
  onTrace: (t) => trace.push(t)
});
const files = await emit({ result, directory: OUT });

writeFileSync(
  join(EXAMPLES, "weather-trace.json"),
  JSON.stringify({ entity: result["entity-schema"], trace, files }, null, 2)
);
console.log(`Wrote ${files.length} files to ${OUT}`);
console.log(`Trace saved to examples/weather-trace.json`);
