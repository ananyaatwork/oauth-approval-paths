import Link from "next/link";
import type { Guide } from "@/lib/schema";
import { AXIS_TICKS, PHASE_OWNER, axisPos, fastestAndLongest, formatHours, phaseHours } from "@/lib/time";
import { DifficultyDots } from "./DifficultyDots";

const OWNER_BG = { you: "bg-you", provider: "bg-provider", customer_admin: "bg-customer" } as const;
const OWNER_TEXT = { you: "text-you", provider: "text-provider", customer_admin: "text-customer" } as const;
const UNKNOWN_W = 0.035;
const band = (h: number) => (h < 24 ? "same day" : h < 24 * 30 ? "days to weeks" : "a month or more");

export function OwnerLegend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
      <li className={item}><span className="h-2 w-3 rounded-[2px] bg-you" />You</li>
      <li className={item}><span className="h-2 w-3 rounded-[2px] bg-provider" />Provider review</li>
      <li className={item}><span className="h-2 w-3 rounded-[2px] bg-customer" />Each customer&rsquo;s admin</li>
      <li className={item}><span className="hatch h-2 w-3 rounded-[2px]" />Review time not published</li>
      <li className={item}><span className="h-3 w-[2px] bg-ink" />Fastest path done</li>
    </ul>
  );
}

function Bar({ guide }: { guide: Guide }) {
  const { fastest, longest } = fastestAndLongest(guide.paths);
  let cum = 0;
  const known: { from: number; to: number; owner: keyof typeof OWNER_BG; label: string }[] = [];
  const unknown: { owner: keyof typeof OWNER_BG; label: string }[] = [];
  for (const p of longest.path.timeline) {
    const h = phaseHours(p);
    const owner = PHASE_OWNER[p.kind];
    if (h == null || p.basis === "no_stated_sla") {
      unknown.push({ owner, label: p.label });
      if (h != null) cum += h;
      continue;
    }
    known.push({ from: axisPos(cum), to: axisPos(cum + h), owner, label: p.label });
    cum += h;
  }
  const end = axisPos(cum);
  const fastPos = axisPos(fastest.span.max);

  return (
    <span className="relative block h-4" aria-hidden>
      {AXIS_TICKS.map((t) => (
        <span key={t.label} className="absolute -top-1 h-6 w-px bg-line" style={{ left: `${axisPos(t.h) * 100}%` }} />
      ))}
      <span className="absolute top-1 h-2 w-full rounded-full bg-line/40" />
      {known.map((s, i) => (
        <span
          key={i}
          title={s.label}
          className={`absolute top-1 h-2 ${OWNER_BG[s.owner]}`}
          style={{ left: `${s.from * 100}%`, width: `${Math.max(0.6, (s.to - s.from) * 100)}%` }}
        />
      ))}
      {unknown.map((u, i) => (
        <span
          key={`u${i}`}
          title={`${u.label}: review time not published`}
          className={`hatch-owner absolute top-1 h-2 ${OWNER_TEXT[u.owner]}`}
          style={{ left: `${Math.min(1 - UNKNOWN_W, end + i * UNKNOWN_W) * 100}%`, width: `${UNKNOWN_W * 100}%` }}
        />
      ))}
      <span className="absolute -top-0.5 h-5 w-[2px] rounded-full bg-ink" style={{ left: `calc(${fastPos * 100}% - 1px)` }} />
    </span>
  );
}

export function LibraryChart({ guides }: { guides: Guide[] }) {
  const rows = guides
    .map((g) => ({ g, ...fastestAndLongest(g.paths) }))
    .sort((a, b) => a.longest.span.max - b.longest.span.max || a.g.verdict.difficulty - b.g.verdict.difficulty);

  return (
    <div className="text-sm">
      <div className="mb-4">
        <OwnerLegend />
      </div>
      <div className="grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] gap-x-5 max-sm:grid-cols-1">
        <div />
        <div className="relative h-5 max-sm:hidden" aria-hidden>
          {AXIS_TICKS.map((t, i) => (
            <span
              key={t.label}
              className={`absolute whitespace-nowrap text-xs text-muted ${i === 0 ? "" : i === AXIS_TICKS.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: `${axisPos(t.h) * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <ul className="border-t border-line">
        {rows.map(({ g, fastest, longest }, i) => {
          const unknowns = longest.path.timeline.filter((p) => p.basis === "no_stated_sla" || phaseHours(p) == null).length;
          const b = band(longest.span.max);
          const showBand = i === 0 || band(rows[i - 1].longest.span.max) !== b;
          return (
            <li key={g.slug}>
              {showBand && (
                <p className="border-b border-line px-1 pb-1.5 pt-5 text-[13px] font-medium text-muted first:pt-3">
                  Longest path: {b}
                </p>
              )}
              <Link
                href={`/guides/${g.slug}`}
                className="group grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] items-center gap-x-5 gap-y-2 border-b border-line px-1 py-3.5 hover:bg-surface max-sm:grid-cols-1"
              >
                <span>
                  <span className="font-semibold group-hover:underline underline-offset-2">{g.name}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <DifficultyDots value={g.verdict.difficulty} />
                    {g.paths.length} {g.paths.length === 1 ? "path" : "paths"}
                  </span>
                </span>
                <span className="block">
                  <Bar guide={g} />
                  <span className="mt-2 block text-[13px] tabular-nums">
                    {formatHours(fastest.span.max)} to {formatHours(longest.span.max)}
                    {unknowns > 0 && (
                      <span className="text-muted">
                        {" "}plus {unknowns} {unknowns === 1 ? "wait" : "waits"} with no published time
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Log scale: each gridline is a step up in waiting. The coloured bar is the longest path; the black tick is where
        the fastest path finishes.
      </p>
    </div>
  );
}
