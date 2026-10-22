"use client";

import { useState } from "react";
import type { Guide } from "@/lib/schema";
import { formatHours, pathSpan, waitsOn } from "@/lib/time";
import { Evidence } from "./Evidence";
import { OwnerBar } from "./PathTimeline";
import { DifficultyDots } from "./DifficultyDots";

// Lets the reader pick the route that matches their situation, so the top of
// the guide answers "how long for me?" rather than for every route at once.
export function VerdictPanel({ guide, sourceInfo }: { guide: Guide; sourceInfo: Record<string, string> }) {
  const [i, setI] = useState(0);
  const path = guide.paths[i] ?? guide.paths[0];
  if (!path) return null;
  const span = pathSpan(path);
  const waits = waitsOn(path);
  const blocker = guide.prerequisites[0];
  const label = "text-[13px] text-muted";

  return (
    <div className="card raised mt-6 p-4 sm:p-5">
      <p id="path-q" className="text-sm font-semibold">
        {guide.paths.length > 1 ? "Which fits you?" : "Your route"}
      </p>
      {guide.paths.length > 1 ? (
        <div role="radiogroup" aria-labelledby="path-q" className="seg mt-3">
          {guide.paths.map((p, n) => (
            <button key={p.name} type="button" role="radio" aria-checked={n === i} onClick={() => setI(n)}>
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-1 font-medium">{path.name}</p>
      )}
      <p className="mt-3 max-w-[72ch] text-sm text-muted">{path.whenThisApplies}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_1.2fr_1.5fr]">
        <div className="tile p-4">
          <p className={label}>Time to production</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight tabular-nums">
            {formatHours(span.max)}
            {span.openEnded && <span className="text-xl font-medium text-muted">+</span>}
          </p>
          <p className={`mt-2 text-[13px] ${span.openEnded ? "text-provider" : "text-you"}`}>
            {span.openEnded ? "plus waits with no published time" : "no unpublished waits"}
          </p>
        </div>
        <div className="tile p-4">
          <p className={label}>Difficulty</p>
          <p className="mt-3 flex items-center gap-2">
            <DifficultyDots value={path.difficulty} className="[&>span]:h-2 [&>span]:w-2" />
            <span className="text-sm tabular-nums">{path.difficulty} of 5</span>
          </p>
        </div>
        <div className="tile p-4">
          <p className={label}>You&rsquo;ll wait on</p>
          <p className="mt-2 text-sm leading-snug">{waits.length ? waits.join(" and ") : "Nobody. No review found on this route."}</p>
        </div>
        <div className="tile p-4">
          <p className={label}>Blocks you first</p>
          {blocker ? (
            <p className="mt-2 text-sm leading-snug">
              <span className="line-clamp-3">{blocker.item}</span>{" "}
              <Evidence level={blocker.confidence} sources={blocker.sources} sourceInfo={sourceInfo} />
            </p>
          ) : (
            <p className="mt-2 text-sm">Nothing found that blocks submitting.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <OwnerBar path={path} className="h-2" />
      </div>
    </div>
  );
}
