import type { Guide } from "../schema";
import type { TraceEvent } from "../trace";
import { enforceProvenance } from "../provenance";
import { makeSearcher, type SearchResult } from "./search";
import { readPage, relevantText, type Page } from "./read";
import { writeGuide } from "./write";
import { WRITER_SYSTEM } from "./prompt";

const MAX_PAGES = 6;
const READ_PARALLEL = 3;
const THIRD_PARTY = [
  "medium.com", "reddit.com", "stackoverflow.com", "youtube.com", "github.com", "dev.to", "quora.com", "linkedin.com",
  "nango.dev", "composio.dev", "pipedream.com", "zapier.com", "make.com", "merge.dev", "paragon.com", "wikipedia.org",
];

// "developers.notion.com" -> "notion.com", "api.xero.co.nz" -> "xero.co.nz"
function siteOf(url: string) {
  try {
    const parts = new URL(url).hostname.replace(/^www\./, "").split(".");
    const sld = parts.length > 2 && ["co", "com", "org", "net", "gov", "ac"].includes(parts[parts.length - 2]);
    return parts.slice(-(sld ? 3 : 2)).join(".");
  } catch {
    return "";
  }
}

function officialSite(target: string, key: string, results: SearchResult[]) {
  if (/\.[a-z]{2,}/i.test(target)) {
    const fromInput = siteOf(target.startsWith("http") ? target : `https://${target}`);
    if (fromInput) return fromInput;
  }
  const counts = new Map<string, number>();
  for (const r of results) {
    const s = siteOf(r.url);
    if (!s || THIRD_PARTY.some((t) => s === t)) continue;
    counts.set(s, (counts.get(s) ?? 0) + (s.startsWith(key) ? 3 : 1));
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

const DOCS_HINT = /(developer|docs|api|oauth|auth|app|review|marketplace|publish|distribut|verif|scope|partner|integration)/i;

export async function researchApp(target: string, key: string, send: (e: TraceEvent) => void): Promise<Guide> {
  const today = new Date().toISOString().slice(0, 10);
  const search = makeSearcher((from, reason, hasBackup) =>
    send({
      type: "status",
      message: `${from} search unavailable (${reason.slice(0, 80)})${hasBackup ? "; switching to the backup" : ""}`,
    }),
  );

  send({ type: "status", message: `Researching ${target}: searching the web, then reading the provider's own pages` });
  send({ type: "stage", stage: "searching" });

  const queries = [
    `${target} OAuth app developer documentation`,
    `${target} app review approval process publish marketplace requirements`,
    `${target} OAuth scopes verification rate limits token expiry`,
  ];
  const all: SearchResult[] = [];
  for (const q of queries) {
    send({ type: "search", query: q });
    const { results } = await search(q);
    send({ type: "results", query: q, results: results.slice(0, 5).map(({ title, url }) => ({ title, url })) });
    all.push(...results);
  }

  const site = officialSite(target, key, all);
  const seen = new Set<string>();
  const unique = all.filter((r) => {
    const k = r.url.replace(/[#?].*$/, "").replace(/\/$/, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const rank = (r: SearchResult) => (siteOf(r.url) === site ? 10 : 0) + (DOCS_HINT.test(r.url) ? 3 : 0) + (DOCS_HINT.test(r.title) ? 1 : 0);
  const candidates = unique.sort((a, b) => rank(b) - rank(a)).slice(0, MAX_PAGES + 3);

  send({ type: "stage", stage: "reading" });
  const pages: Page[] = [];
  for (let i = 0; i < candidates.length && pages.length < MAX_PAGES; i += READ_PARALLEL) {
    const batch = candidates.slice(i, i + Math.min(READ_PARALLEL, MAX_PAGES - pages.length));
    const read = await Promise.all(
      batch.map(async (r) => {
        send({ type: "fetch", url: r.url });
        const page = await readPage(r.url);
        if ("error" in page) send({ type: "fetch_error", url: r.url, code: page.error });
        else send({ type: "fetched", url: page.url, title: page.via === "jina" ? `${page.title} (via reader)` : page.title });
        return page;
      }),
    );
    for (const p of read) if (!("error" in p)) pages.push(p);
  }

  const sources: Guide["sources"] = [];
  const blocks: string[] = [];
  pages.forEach((p, i) => {
    const id = `s${i + 1}`;
    const kind = siteOf(p.url) === site ? "primary" : "secondary";
    sources.push({ id, url: p.url, title: p.title, accessed: today, supports: "Page read during research", kind });
    blocks.push(`[${id}] ${kind === "primary" ? "PROVIDER PAGE" : "THIRD-PARTY PAGE"} (opened): ${p.title}\n${p.url}\n${relevantText(p) || "(no relevant paragraphs found)"}`);
  });
  const readUrls = new Set(pages.map((p) => p.url));
  unique
    .filter((r) => !readUrls.has(r.url) && r.snippet)
    .slice(0, 6)
    .forEach((r, i) => {
      const id = `s${pages.length + i + 1}`;
      sources.push({ id, url: r.url, title: r.title, accessed: today, supports: "Search result snippet only (page not opened)", kind: "secondary" });
      blocks.push(`[${id}] SEARCH SNIPPET (not opened): ${r.title}\n${r.url}\n${r.snippet}`);
    });

  if (!pages.length && !blocks.length) throw new Error(`Search found nothing usable for ${target}. Try the app's website address.`);

  send({ type: "stage", stage: "writing" });
  const prompt = [
    `App requested: ${target}`,
    `Likely provider website: ${site || "unknown"}`,
    `Today: ${today}`,
    "",
    "Sources (cite only these ids):",
    blocks.join("\n\n---\n\n"),
  ].join("\n");

  const { content, model } = await writeGuide(WRITER_SYSTEM, prompt, (m, error) =>
    send({ type: "status", message: error ? `${m} couldn't write the guide (${error.slice(0, 90)}); trying the next model` : `Writing the guide with ${m}` }),
  );

  const ids = new Set(sources.map((s) => s.id));
  const strip = <T extends { sources: string[] }>(c: T) => ({ ...c, sources: c.sources.filter((id) => ids.has(id)) });
  const guide = {
    ...content,
    paths: content.paths.map((p) => ({ ...p, timeline: p.timeline.map(strip) })),
    beforeApproval: content.beforeApproval.map(strip),
    prerequisites: content.prerequisites.map(strip),
    steps: content.steps.map(strip),
    submissionChecklist: content.submissionChecklist.map(strip),
    gotchas: content.gotchas.map(strip),
    sources,
  };

  send({ type: "stage", stage: "checking" });
  const downgraded = enforceProvenance(
    guide,
    new Set(sources.filter((s) => s.kind === "primary" && readUrls.has(s.url)).map((s) => s.url)),
    new Set(sources.filter((s) => !(s.kind === "primary" && readUrls.has(s.url))).map((s) => s.url)),
  );
  send({ type: "provenance", downgraded, opened: pages.length });
  if (downgraded > 0) {
    guide.unknowns.push(`${downgraded} fact(s) were downgraded automatically because they cite a third-party page or a search snippet, not a provider page we opened.`);
  }
  if (pages.length < 2) guide.unknowns.push("Few provider pages could be read, so most of this guide rests on search snippets.");

  return { ...guide, slug: key, origin: "live", researchedOn: today, model, verification: null };
}
