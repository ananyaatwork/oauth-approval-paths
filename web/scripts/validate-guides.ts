import fs from "fs";
import path from "path";
import { Guide } from "../src/lib/schema";

const dir = path.resolve("src/guides");
const only = process.argv[2];
let failed = 0;

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  if (only && !file.startsWith(only)) continue;
  const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const result = Guide.safeParse(raw);
  const problems: string[] = [];
  if (!result.success) {
    problems.push(...result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  } else {
    const g = result.data;
    const ids = new Set(g.sources.map((s) => s.id));
    const refs = [
      ...g.paths.flatMap((p) => p.timeline),
      ...g.beforeApproval,
      ...g.prerequisites,
      ...g.steps,
      ...g.submissionChecklist,
      ...g.gotchas,
    ].flatMap((c) => c.sources);
    for (const r of refs) if (!ids.has(r)) problems.push(`unknown source id "${r}"`);
    for (const d of [g.verdict.difficulty, ...g.paths.map((p) => p.difficulty)])
      if (d < 1 || d > 5) problems.push(`difficulty out of range: ${d}`);
    if (`${g.slug}.json` !== file) problems.push(`slug "${g.slug}" does not match file name`);
  }
  if (problems.length) {
    failed++;
    console.log(`FAIL ${file}\n  ${problems.slice(0, 15).join("\n  ")}`);
  } else console.log(`ok   ${file}`);
}
process.exit(failed ? 1 : 0);
