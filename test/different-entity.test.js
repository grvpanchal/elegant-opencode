// Sanity: feed a non-Todo entity ("Comment") through the orchestrator and
// confirm the pipeline projects the same skills onto a different entity —
// producing 128 files with the entity name woven through every layer.

import { runPipeline } from "../src/orchestrator.js";
import { emit } from "../src/code-emitter.js";
import { emitFixed } from "../src/deterministic-emitters.js";
import { rmSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const OUT = join(process.cwd(), "test", "comment-out");
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const COMMENT = {
  name: "Comment",
  slice: "comment",
  appName: "Comment App",
  projectName: "comment-app",
  itemsField: "commentItems",
  currentField: "currentCommentItem",
  operations: ["create", "edit", "update", "delete"]
};

// Pass-through LLM: for each variable microtask, return the deterministic
// emitter output for the Comment entity. This is the same pattern the real
// LLM agent would produce when bound to its SKILL.md slice.
const llm = async ({ task }) => {
  if (task === "entity-schema") return JSON.stringify(COMMENT);
  return JSON.stringify(emitFixed(task, COMMENT, {}));
};

const result = await runPipeline({ entitySpec: { spec: "comments" }, llm, onTrace: () => {} });
await emit({ result, directory: OUT });

const files = walk(OUT).map((f) => f.slice(OUT.length + 1));

const checks = [
  ["produced ≥ 100 files", files.length >= 100],
  ["entity slice folder exists", files.some((f) => f.startsWith("src/state/comment/"))],
  ["domain atom is CommentItem", files.includes("src/ui/atoms/CommentItem/CommentItem.component.jsx")],
  ["organism is CommentList", files.includes("src/ui/organisms/CommentList/CommentList.component.jsx")],
  ["container is CommentListContainer", files.includes("src/containers/CommentListContainer.jsx")],
  ["AddCommentForm molecule", files.includes("src/ui/molecules/AddCommentForm/AddCommentForm.component.jsx")],
  ["actions reference create/edit/update/delete", containsAll(read("src/state/comment/comment.actions.js"), ["createComment", "editComment", "updateComment", "deleteComment"])],
  ["actions do NOT include toggle (not in operations)", !read("src/state/comment/comment.actions.js").includes("toggleComment")],
  ["selectors reference commentItems field", read("src/state/comment/comment.selectors.js").includes("commentItems")],
  ["container uses useSelector + useDispatch", containsAll(read("src/containers/CommentListContainer.jsx"), ["useSelector", "useDispatch"])]
];

let bad = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) bad++;
}
console.log(`\nfiles: ${files.length}`);
process.exit(bad ? 1 : 0);

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
function read(rel) {
  const p = join(OUT, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}
function containsAll(s, needles) { return needles.every((n) => s.includes(n)); }
