import type { Confidence } from "@/lib/schema";

const LABEL: Record<Confidence, string> = {
  confirmed: "Confirmed on the provider's docs",
  secondary: "From a secondary source",
  unconfirmed: "Not confirmed",
};

export function ConfidenceGlyph({ level, size = 10 }: { level: Confidence; size?: number }) {
  const r = size / 2 - 1;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      {level === "confirmed" && <circle cx={c} cy={c} r={r} fill="currentColor" />}
      {level === "secondary" && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d={`M${c} ${c - r} A${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill="currentColor" />
        </>
      )}
      {level === "unconfirmed" && (
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.4" />
      )}
    </svg>
  );
}

export function Evidence({
  level,
  sources,
  titles,
}: {
  level: Confidence;
  sources: string[];
  titles: Record<string, string>;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle text-xs text-muted">
      <span className="inline-flex items-center" title={LABEL[level]}>
        <ConfidenceGlyph level={level} />
        <span className="sr-only">{LABEL[level]}</span>
      </span>
      {sources.map((id) => (
        <a key={id} href={`#src-${id}`} title={titles[id]} className="underline decoration-line underline-offset-2 hover:text-ink">
          {id}
        </a>
      ))}
    </span>
  );
}

export function EvidenceKey() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
      {(Object.keys(LABEL) as Confidence[]).map((k) => (
        <li key={k} className="inline-flex items-center gap-1.5">
          <ConfidenceGlyph level={k} />
          {LABEL[k]}
        </li>
      ))}
    </ul>
  );
}
