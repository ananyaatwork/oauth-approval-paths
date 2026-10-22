import type { Confidence } from "@/lib/schema";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "Confirmed on the provider's own docs",
  secondary: "From a secondary source",
  unconfirmed: "Not confirmed",
};

export function ConfidenceGlyph({ level, size = 12 }: { level: Confidence; size?: number }) {
  const r = size / 2 - 1;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      {level === "confirmed" && <circle cx={c} cy={c} r={r} fill="currentColor" />}
      {level === "secondary" && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d={`M${c} ${c - r} A${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill="currentColor" />
        </>
      )}
      {level === "unconfirmed" && (
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 1.6" />
      )}
    </svg>
  );
}

// sourceInfo maps a source id to "Title · accessed 21 Oct 2026".
export function Evidence({
  level,
  sources,
  sourceInfo,
}: {
  level: Confidence;
  sources: string[];
  sourceInfo: Record<string, string>;
}) {
  // Native tooltips only: they appear after a pause and never cover the text
  // a reader is scanning. The source ids stay as links to the full list.
  return (
    <span className="inline-flex items-center gap-1.5 align-middle text-xs text-muted">
      <span className="inline-flex items-center" title={CONFIDENCE_LABEL[level]} role="img" aria-label={CONFIDENCE_LABEL[level]}>
        <ConfidenceGlyph level={level} />
      </span>
      {sources.map((id) => (
        <a
          key={id}
          href={`#src-${id}`}
          title={sourceInfo[id] ?? "Source"}
          className="text-[var(--focus)] underline decoration-[var(--focus)]/40 underline-offset-2 hover:decoration-[var(--focus)]"
        >
          {id}
        </a>
      ))}
    </span>
  );
}

export function EvidenceKey() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
      {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((k) => (
        <li key={k} className="inline-flex items-center gap-1.5">
          <ConfidenceGlyph level={k} />
          {CONFIDENCE_LABEL[k]}
        </li>
      ))}
    </ul>
  );
}
