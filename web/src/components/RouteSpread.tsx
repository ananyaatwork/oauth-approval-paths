import type { Path } from "@/lib/schema";
import { formatHours, pathSpan, waitsOn } from "@/lib/time";
import { OwnerBar } from "./PathTimeline";
import { DifficultyDots } from "./DifficultyDots";

// Every route as a card. Stacked like a deck by default; "Compare" spreads
// them side by side. CSS-only, so it works before any JavaScript loads.
export function RouteSpread({ paths }: { paths: Path[] }) {
  if (paths.length < 2) return null;
  const centre = (paths.length - 1) / 2;
  return (
    <div className="spread mb-8">
      <label className="spread-label btn-ghost px-3.5 py-1.5 text-sm font-medium">
        <input type="checkbox" className="spread-toggle" />
        <span className="when-closed">Compare all {paths.length} routes side by side</span>
        <span className="when-open">Stack the routes again</span>
      </label>
      <div className="spread-stage">
        <ol className="spread-row" aria-label="Routes">
          {paths.map((p, i) => {
            const span = pathSpan(p);
            const waits = waitsOn(p);
            return (
              <li
                key={p.name}
                className="spread-item flex min-h-52 flex-col rounded-2xl border border-line bg-surface p-4 shadow-[0_14px_30px_-22px_rgb(0_0_0/0.7)]"
                style={{ ["--i" as string]: i, ["--c" as string]: centre }}
              >
                <p className="text-[13px] text-muted">Route {i + 1}</p>
                <h3 className="mt-0.5 font-semibold leading-snug">{p.name}</h3>
                <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums">
                  {formatHours(span.max)}
                  {span.openEnded && <span className="text-lg font-medium text-muted">+</span>}
                </p>
                <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                  <DifficultyDots value={p.difficulty} /> {p.difficulty} of 5
                </p>
                <p className="mt-2 text-[13px]">
                  {waits.length ? <>Waits on {waits.join(" and ")}</> : "No review on this route"}
                </p>
                <div className="mt-auto pt-4">
                  <OwnerBar path={p} className="h-1.5" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
