import type { Confidence, GuideContent } from "./schema";

const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();

// A claim may only be "confirmed" if the agent actually opened a cited page in
// this run; a URL seen only as a search result caps it at "secondary", and a
// URL the agent never saw caps it at "unconfirmed". Returns the number of
// claims downgraded so the guide can say so.
export function enforceProvenance(
  guide: GuideContent,
  fetched: Set<string>,
  searched: Set<string>,
): number {
  const f = new Set([...fetched].map(norm));
  const s = new Set([...searched].map(norm));
  const seen = new Map<string, "fetched" | "searched" | "unseen">();
  for (const src of guide.sources) {
    const n = norm(src.url);
    const how = f.has(n) ? "fetched" : s.has(n) ? "searched" : "unseen";
    seen.set(src.id, how);
    if (how === "unseen") src.supports = `${src.supports} (cited but not opened in this run)`;
  }

  const rank: Record<Confidence, number> = { confirmed: 2, secondary: 1, unconfirmed: 0 };
  const cap = (ids: string[]): Confidence => {
    const best = Math.max(-1, ...ids.map((id) => ({ fetched: 2, searched: 1, unseen: 0 })[seen.get(id) ?? "unseen"]));
    return best >= 2 ? "confirmed" : best === 1 ? "secondary" : "unconfirmed";
  };

  let downgraded = 0;
  const claims = [
    ...guide.paths.flatMap((p) => p.timeline),
    ...guide.beforeApproval,
    ...guide.prerequisites,
    ...guide.steps,
    ...guide.submissionChecklist,
    ...guide.gotchas,
  ];
  for (const c of claims) {
    const max = cap(c.sources);
    if (rank[c.confidence] > rank[max]) {
      c.confidence = max;
      downgraded++;
    }
  }
  return downgraded;
}
