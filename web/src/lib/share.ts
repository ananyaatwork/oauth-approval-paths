import type { Guide } from "./schema";

export function guideMarkdown(g: Guide): string {
  const t = (c: string) => ({ confirmed: "confirmed", secondary: "secondary source", unconfirmed: "unconfirmed" })[c];
  const lines = [
    `# ${g.name}: OAuth app setup and approval`,
    "",
    `> ${g.verdict.headline}`,
    "",
    `**Next:** ${g.verdict.nextAction}`,
    "",
    `Difficulty ${g.verdict.difficulty}/5. Researched ${g.researchedOn}${g.model ? ` with ${g.model}` : ""}. Evidence tags: confirmed = provider's docs, secondary = blog/forum/vendor, unconfirmed = not verified.`,
    "",
    "## Paths and timelines",
    ...g.paths.flatMap((p) => [
      `### ${p.name} (difficulty ${p.difficulty}/5)`,
      p.whenThisApplies,
      ...p.timeline.map(
        (ph) =>
          `- ${ph.label}: ${ph.basis === "no_stated_sla" ? "no stated SLA" : `${ph.min ?? "?"}–${ph.max ?? "?"} ${ph.unit.replace("_", " ")}`}${ph.basis === "estimated" ? " (estimate)" : ""} [${t(ph.confidence)}]`,
      ),
      "",
    ]),
    "## Steps",
    ...g.steps.map((s, i) => `${i + 1}. **${s.title}** (${s.owner.replace("_", " ")}) ${s.detail} [${t(s.confidence)}]`),
    "",
    "## What works before approval",
    ...g.beforeApproval.map((i) => `- ${i.item} [${t(i.confidence)}]`),
    "",
    "## Blocks submission",
    ...g.prerequisites.map((i) => `- ${i.item} [${t(i.confidence)}]`),
    "",
    ...(g.reconnect ? ["## How often users must reconnect", `- ${g.reconnect.item}${g.reconnect.detail ? ` ${g.reconnect.detail}` : ""} [${t(g.reconnect.confidence)}]`, ""] : []),
    "## Have ready for review",
    ...g.submissionChecklist.map((i) => `- [ ] ${i.item} [${t(i.confidence)}]`),
    "",
    "## Watch out for",
    ...g.gotchas.map((x) => `- **${x.title}** ${x.detail} [${t(x.confidence)}]`),
    "",
    "## If you're blocked",
    ...g.blockers.map((b) => `- **${b.symptom}** ${b.whatToDo}${b.contact ? ` (${b.contact})` : ""}`),
    ...g.escalation.channels.map((c) => `- ${c.label}${c.url ? `: ${c.url}` : ""}`),
    "",
    "## Not confirmed",
    ...g.unknowns.map((u) => `- ${u}`),
    "",
    "## Sources",
    ...g.sources.map((s) => `- ${s.id}: [${s.title}](${s.url}) (${s.kind}, accessed ${s.accessed})`),
  ];
  return lines.join("\n");
}
