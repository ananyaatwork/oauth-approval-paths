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
    <div className="mt-6">
      {guide.paths.length > 1 && (
        <div>
          <p id="path-q" className="text-sm font-medium">Which fits you?</p>
          <div role="radiogroup" aria-labelledby="path-q" className="mt-2 flex flex-wrap gap-2">
            {guide.paths.map((p, n) => (
              <button
                key={p.name}
                type="button"
                role="radio"
                aria-checked={n === i}
                onClick={() => setI(n)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${n === i ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 max-w-[72ch] text-sm text-muted">{path.whenThisApplies}</p>

      <div className="mt-3 border border-line bg-surface">
        <div className="grid grid-cols-2 max-md:[&>*:nth-child(-n+2)]:border-b max-md:[&>*:nth-child(odd)]:border-r md:grid-cols-[1.1fr_0.8fr_1.2fr_1.5fr] md:divide-x [&>*]:border-line">
          <div className="px-4 py-3.5 sm:px-5">
            <p className={label}>Time to production</p>
            <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
              {formatHours(span.max)}
              {span.openEnded && <span className="text-xl font-medium text-muted">+</span>}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">
              {span.openEnded ? "plus waits with no published time" : "no unpublished waits"}
            </p>
          </div>
          <div className="px-4 py-3.5 sm:px-5">
            <p className={label}>Difficulty</p>
            <p className="mt-2.5 flex items-center gap-2">
              <DifficultyDots value={path.difficulty} className="[&>span]:h-2 [&>span]:w-2" />
              <span className="text-sm tabular-nums">{path.difficulty} of 5</span>
            </p>
          </div>
          <div className="px-4 py-3.5 sm:px-5">
            <p className={label}>You&rsquo;ll wait on</p>
            <p className="mt-1 text-sm leading-snug">
              {waits.length ? waits.join(" and ") : "Nobody. No review found on this route."}
            </p>
          </div>
          <div className="px-4 py-3.5 sm:px-5">
            <p className={label}>Blocks you first</p>
            {blocker ? (
              <p className="mt-1 text-sm leading-snug">
                <span className="line-clamp-3">{blocker.item}</span>{" "}
                <Evidence level={blocker.confidence} sources={blocker.sources} sourceInfo={sourceInfo} />
              </p>
            ) : (
              <p className="mt-1 text-sm">Nothing found that blocks submitting.</p>
            )}
          </div>
        </div>
        <div className="border-t border-line px-4 py-2.5 sm:px-5">
          <OwnerBar path={path} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
