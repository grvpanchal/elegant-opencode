// Single-run harness: runs the pipeline once with the simulated small model
// and asserts every microtask produced a schema-valid output and real files.

import { runPipeline } from "../src/orchestrator.js";
import { makeSimLLM } from "./sim-llm.js";
import { emit } from "../src/code-emitter.js";
import { rmSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const OUT = join(process.cwd(), "test", "out");
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const trace = [];
const llm = makeSimLLM(42);
const result = await runPipeline({
  entitySpec: { spec: "build a todo app" },
  llm,
  onTrace: (t) => trace.push(t)
});

await emit({ result, directory: OUT });

const files = walk(OUT);
const ok = trace.filter((t) => t.ok).length;
const fail = trace.filter((t) => !t.ok).length;
console.log(JSON.stringify({ ok, fail, files: files.length, trace }, null, 2));

if (fail > 0 && !trace.every((t) => t.ok || trace.some((u) => u.task === t.task && u.ok))) {
  console.error("UNRECOVERED FAILURES");
  process.exit(1);
}
if (files.length < 10) {
  console.error("expected at least 10 files");
  process.exit(1);
}
console.log("OK");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
