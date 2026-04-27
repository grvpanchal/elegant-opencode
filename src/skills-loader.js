// Loads grvpanchal/elegant SKILL.md files from disk and slices out only the
// "Key Principles" + "Best Practices" + first code pattern. Small models do
// best with tight, exemplar-rich prompts; we strip the rest.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_ROOT =
  process.env.ELEGANT_SKILLS_ROOT ||
  join(process.cwd(), "..", "elegant-ref", "skills");

export function loadSkill(skillName, root = DEFAULT_ROOT) {
  if (!skillName) return null;
  const p = join(root, skillName, "SKILL.md");
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  return compactSkill(raw);
}

export function compactSkill(md) {
  // Strip frontmatter
  const body = md.replace(/^---[\s\S]*?---\s*/, "");
  // Take headings: "Key Principles", "Best Practices", first "Code Patterns" block
  const sections = splitByH2(body);
  const want = ["Key Principles", "Best Practices", "Code Patterns"];
  const kept = [];
  for (const w of want) {
    const s = sections.find((s) => s.title.toLowerCase() === w.toLowerCase());
    if (s) kept.push(`## ${s.title}\n${truncate(s.body, 1200)}`);
  }
  return kept.join("\n\n").trim();
}

function splitByH2(md) {
  const lines = md.split("\n");
  const out = [];
  let cur = null;
  for (const line of lines) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m) {
      if (cur) out.push(cur);
      cur = { title: m[1].trim(), body: "" };
    } else if (cur) {
      cur.body += line + "\n";
    }
  }
  if (cur) out.push(cur);
  return out;
}

function truncate(s, n) {
  if (s.length <= n) return s;
  // truncate at code-fence boundary if possible
  const cut = s.slice(0, n);
  const lastFence = cut.lastIndexOf("```");
  if (lastFence > 0 && (cut.match(/```/g) || []).length % 2 === 1) {
    return cut.slice(0, lastFence) + "\n```\n";
  }
  return cut + "\n…";
}
