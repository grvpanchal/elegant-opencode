// N-run stability harness. Runs the pipeline 25 times across different seeds.
// PASS criteria:
//   • every run produces all 15 microtasks schema-valid (after ≤3 attempts)
//   • file sets are identical across runs (deterministic + repair = stable)
//   • critical files (organism, operations, service, page) byte-identical

import { runPipeline } from "../src/orchestrator.js";
import { makeSimLLM } from "./sim-llm.js";
import { emit } from "../src/code-emitter.js";
import { rmSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const N = parseInt(process.env.N || "25", 10);
const RUNS = [];
const failures = [];

for (let i = 0; i < N; i++) {
  const out = join(process.cwd(), "test", "stab", `run-${i}`);
  if (existsSync(out)) rmSync(out, { recursive: true, force: true });
  const trace = [];
  try {
    const result = await runPipeline({
      entitySpec: { spec: "build a todo app" },
      llm: makeSimLLM(i * 31 + 7),
      onTrace: (t) => trace.push(t)
    });
    await emit({ result, directory: out });
    RUNS.push({ i, files: hashTree(out), trace });
  } catch (e) {
    failures.push({ i, error: e.message, trace });
  }
}

// Compare tree hashes across runs
const firstHash = RUNS[0]?.files?.tree;
const stable = RUNS.every((r) => r.files.tree === firstHash);

const totalAttempts = RUNS.flatMap((r) => r.trace).filter((t) => t.attempt).length;
const totalRecovered = RUNS.flatMap((r) => r.trace).filter((t) => t.ok && (t.attempt || 1) > 1).length;
const llmCalls = RUNS.flatMap((r) => r.trace).filter((t) => t.via && t.via.startsWith("llm:")).length;
const detCalls = RUNS.flatMap((r) => r.trace).filter((t) => t.via === "deterministic").length;

const report = {
  runs: RUNS.length,
  failures: failures.length,
  stableTreeAcrossRuns: stable,
  treeHash: firstHash,
  llmCalls,
  detCalls,
  llmShare: +(llmCalls / (llmCalls + detCalls)).toFixed(3),
  totalRepairAttempts: totalAttempts,
  recoveredAfterRepair: totalRecovered,
  perRunFiles: RUNS[0]?.files?.count
};

console.log(JSON.stringify(report, null, 2));

if (!stable || failures.length > 0) {
  console.error("STABILITY FAIL");
  if (failures.length) console.error(JSON.stringify(failures.slice(0, 3), null, 2));
  process.exit(1);
}
console.log("STABLE");

function hashTree(root) {
  const files = walk(root).sort();
  const h = createHash("sha256");
  for (const f of files) {
    const rel = f.slice(root.length + 1);
    h.update(rel);
    h.update("\0");
    h.update(readFileSync(f));
    h.update("\0");
  }
  return { tree: h.digest("hex"), count: files.length };
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
