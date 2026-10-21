import Link from "next/link";
import type { Guide } from "@/lib/schema";
import { AXIS_TICKS, axisPos, formatHours, guideSpan, pathSpan } from "@/lib/time";

export function LibraryChart({ guides }: { guides: Guide[] }) {
  const rows = guides
    .map((g) => ({ g, span: guideSpan(g.paths) }))
    .sort((a, b) => a.span.max - b.span.max || a.g.verdict.difficulty - b.g.verdict.difficulty);

  return (
    <div className="text-sm">
      <div className="grid grid-cols-[minmax(7rem,11rem)_1fr] gap-x-4 max-sm:grid-cols-1">
        <div />
        <div className="relative h-6 border-b border-line max-sm:hidden" aria-hidden>
          {AXIS_TICKS.map((t, i) => (
            <span
              key={t.label}
              className={`absolute whitespace-nowrap text-xs text-muted ${i === AXIS_TICKS.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: `${axisPos(t.h) * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <ul>
        {rows.map(({ g, span }) => {
          const fastest = g.paths.map(pathSpan).sort((a, b) => a.max - b.max)[0];
          const start = axisPos(span.min);
          const knownEnd = axisPos(span.max);
          return (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="group grid grid-cols-[minmax(7rem,11rem)_1fr] items-center gap-x-4 border-b border-line py-3 hover:bg-surface max-sm:grid-cols-1 max-sm:gap-y-2"
              >
                <span>
                  <span className="font-semibold group-hover:underline">{g.name}</span>
                  <span className="block text-xs text-muted">
                    Difficulty {g.verdict.difficulty}/5 · {g.paths.length} {g.paths.length === 1 ? "path" : "paths"}
                  </span>
                </span>
                <span className="relative block h-9">
                  {AXIS_TICKS.map((t) => (
                    <span key={t.label} aria-hidden className="absolute top-0 h-full w-px bg-line" style={{ left: `${axisPos(t.h) * 100}%` }} />
                  ))}
                  <span
                    aria-hidden
                    className="absolute top-1.5 h-2.5 rounded-sm bg-ink/80"
                    style={{ left: `${start * 100}%`, width: `${Math.max(1.2, (knownEnd - start) * 100)}%` }}
                  />
                  {span.openEnded && (
                    <span
                      aria-hidden
                      className="hatch absolute top-1.5 h-2.5 rounded-sm opacity-70"
                      style={{ left: `${knownEnd * 100}%`, width: `${Math.min(14, (1 - knownEnd) * 100)}%` }}
                    />
                  )}
                  <span className="absolute bottom-0 left-0 text-xs text-muted tabular-nums">
                    Fastest path {formatHours(fastest?.max ?? 0)} · slowest {formatHours(span.max)}
                    {span.openEnded ? " + no-SLA waits" : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
