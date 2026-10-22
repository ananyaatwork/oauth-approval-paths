import { traceCounts, type TraceLine } from "@/lib/trace";

const ICON: Record<TraceLine["kind"], string> = { search: "⌕", opening: "↗", read: "✓", miss: "×", note: "·", warn: "!" };

export function ResearchLog({ lines, running = false }: { lines: TraceLine[]; running?: boolean }) {
  return (
    <ol className="space-y-1.5 text-sm">
      {lines.map((l, i) => (
        <li
          key={i}
          className={`grid animate-[fadein_150ms_ease-out] grid-cols-[1.25rem_minmax(0,1fr)] ${l.kind === "miss" || l.kind === "warn" ? "text-customer" : ""}`}
        >
          <span aria-hidden className={l.kind === "read" ? "text-you" : "text-muted"}>{ICON[l.kind]}</span>
          <span className="[overflow-wrap:anywhere]">
            {l.kind === "opening" && <span className="text-muted">Opening </span>}
            {l.href ? (
              <a href={l.href} target="_blank" rel="noreferrer" className={`hover:underline ${l.kind === "read" || l.kind === "opening" ? "font-medium" : ""}`}>
                {l.text}
              </a>
            ) : (
              l.text
            )}
            {l.detail && <span className="text-muted"> · {l.detail}</span>}
          </span>
        </li>
      ))}
      {running && (
        <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-muted">
          <span aria-hidden>…</span>
          <span>Working</span>
        </li>
      )}
    </ol>
  );
}

export function ResearchLogSummary({ lines }: { lines: TraceLine[] }) {
  const { searches, read, missed } = traceCounts(lines);
  return (
    <>
      {searches} {searches === 1 ? "search" : "searches"}, {read} {read === 1 ? "page" : "pages"} read
      {missed ? `, ${missed} couldn't be opened` : ""}
    </>
  );
}
