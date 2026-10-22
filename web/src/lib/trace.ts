import type { Guide, TraceLine } from "./schema";

export type { TraceLine };

export type TraceEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "results"; query: string; results: { title: string; url: string }[] }
  | { type: "fetch"; url: string }
  | { type: "fetched"; url: string; title: string | null }
  | { type: "fetch_error"; url: string; code: string }
  | { type: "provenance"; downgraded: number; opened: number }
  | { type: "stage"; stage: Stage }
  | { type: "saved"; guide: Guide; href: string; origin: "library" | "live" }
  | { type: "guide"; guide: Guide; href: string; runsLeft: number | null }
  | { type: "limit"; message: string }
  | { type: "busy"; message: string }
  | { type: "error"; message: string };

export type Stage = "searching" | "reading" | "writing" | "checking" | "done";

export const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

function replaceLast(lines: TraceLine[], pred: (l: TraceLine) => boolean, next: (l: TraceLine) => TraceLine) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (pred(lines[i])) {
      const copy = [...lines];
      copy[i] = next(lines[i]);
      return copy;
    }
  }
  return lines;
}

// Turns the research event stream into log lines. Shared by the server, which
// saves the log with the guide, and the page, which shows it live.
export function reduceTrace(lines: TraceLine[], e: TraceEvent): TraceLine[] {
  switch (e.type) {
    case "status":
      return [...lines, { kind: "note", text: e.message }];
    case "search":
      return [...lines, { kind: "search", text: `Searched “${e.query}”` }];
    case "results":
      return replaceLast(
        lines,
        (l) => l.kind === "search" && l.text.includes(e.query) && !l.detail,
        (l) => ({ ...l, detail: e.results.length ? [...new Set(e.results.map((r) => host(r.url)))].slice(0, 4).join(", ") : "no results" }),
      );
    case "fetch":
      return [...lines, { kind: "opening", text: host(e.url), href: e.url }];
    case "fetched": {
      const next = () => ({ kind: "read" as const, text: host(e.url), detail: e.title ?? undefined, href: e.url });
      const exact = replaceLast(lines, (l) => l.kind === "opening" && l.href === e.url, next);
      // A redirect can change the URL, so fall back to the same host, then any open line.
      if (exact !== lines) return exact;
      const sameHost = replaceLast(lines, (l) => l.kind === "opening" && l.text === host(e.url), next);
      return sameHost !== lines ? sameHost : replaceLast(lines, (l) => l.kind === "opening", next);
    }
    case "fetch_error":
      return replaceLast(
        lines,
        (l) => l.kind === "opening" && l.href === e.url,
        () => ({ kind: "miss", text: host(e.url), detail: `couldn't open (${e.code.replace(/_/g, " ")})`, href: e.url }),
      );
    case "provenance":
      return [
        ...lines,
        e.downgraded
          ? { kind: "warn", text: `Provenance check: ${e.downgraded} fact(s) downgraded because their page wasn't opened` }
          : { kind: "note", text: `Provenance check passed: every “confirmed” fact cites a page the agent opened` },
      ];
    default:
      return lines;
  }
}

export function traceCounts(lines: TraceLine[]) {
  return {
    searches: lines.filter((l) => l.kind === "search").length,
    read: lines.filter((l) => l.kind === "read").length,
    missed: lines.filter((l) => l.kind === "miss").length,
  };
}
