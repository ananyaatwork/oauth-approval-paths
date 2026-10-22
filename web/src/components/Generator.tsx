"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Guide } from "@/lib/schema";
import { reduceTrace, traceCounts, type Stage, type TraceEvent, type TraceLine } from "@/lib/trace";
import { formatDate } from "@/lib/dates";
import { browserFingerprint } from "@/lib/fingerprint";
import { ResearchForm, type KnownApp } from "./ResearchForm";
import { GuideView } from "./GuideView";
import { GuideActions } from "./GuideActions";
import { ResearchLog, ResearchLogSummary } from "./ResearchLog";
import { DifficultyDots } from "./DifficultyDots";

type SavedItem = { slug: string; name: string; researchedOn: string; difficulty: number };
type Notice = { tone: "info" | "stop"; title: string; body: string; href?: string };
export type Sample = { name: string; slug: string; researchedOn: string; log: TraceLine[] };
export type RunningItem = { key: string; app: string; stage: string | null; startedAt: number };
type Status =
  | { state: "none" }
  | { state: "saved"; href: string }
  | ({ state: "running"; lines: TraceLine[] } & RunningItem);

const POLL_MS = 2500;

const STAGES: { id: Exclude<Stage, "done">; label: string }[] = [
  { id: "searching", label: "Searching" },
  { id: "reading", label: "Reading pages" },
  { id: "writing", label: "Writing the guide" },
  { id: "checking", label: "Checking evidence" },
];

function runsText(left: number | null, limit: number) {
  if (left === null) return "Live research runs are unlimited on this deployment.";
  if (left === 0) return "You've used your live research run. Apps that are already researched still open instantly.";
  const n = `${left} live research ${left === 1 ? "run" : "runs"}`;
  return `You have ${n}${limit > left ? " left" : ""}. Apps that are already researched open instantly and don't use it.`;
}

function StageTracker({ stage }: { stage: Stage | null }) {
  const at = stage === "done" ? STAGES.length : STAGES.findIndex((s) => s.id === stage);
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Research progress">
      {STAGES.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <li
            key={s.id}
            aria-current={state === "now" ? "step" : undefined}
            className={`flex items-center gap-1.5 border-b-2 pb-1 ${state === "now" ? "border-[var(--focus)] text-ink" : state === "done" ? "border-transparent text-ink" : "border-transparent text-muted"}`}
          >
            <span aria-hidden className={state === "done" ? "text-you" : ""}>{state === "done" ? "✓" : `${i + 1}`}</span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

function StripSkeleton() {
  return (
    <div aria-hidden className="mt-6 grid max-w-3xl grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface px-4 py-4">
          {/* slop-ok: loading placeholders show the guide is being written */}
          <div className="h-3 w-16 animate-pulse rounded bg-line" />
          {/* slop-ok: loading placeholder */}
          <div className="mt-3 h-6 w-20 animate-pulse rounded bg-line" />
          {/* slop-ok: loading placeholder */}
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

export function Generator({
  known,
  saved,
  sample,
  inProgress,
  initial,
  refresh = false,
  runsLeft: initialRuns,
  runLimit,
}: {
  known: KnownApp[];
  saved: SavedItem[];
  sample: Sample | null;
  inProgress: RunningItem[];
  initial: string;
  refresh?: boolean;
  runsLeft: number | null;
  runLimit: number;
}) {
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [lines, setLines] = useState<TraceLine[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [runs, setRuns] = useState(initialRuns);
  const [savedList, setSavedList] = useState(saved);
  const started = useRef(false);
  // "Research again" applies only to the run the page was opened for.
  const refreshPending = useRef(refresh);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!running || !startedAt) return;
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  function reset(target: string) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setApp(target);
    setLines([]);
    setStage(null);
    setGuide(null);
    setNotice(null);
    setError(null);
    setElapsed(0);
    setStartedAt(Date.now());
    setRunning(true);
    history.replaceState(null, "", `/generate?app=${encodeURIComponent(target)}`);
    return ctrl;
  }

  async function status(target: string, signal: AbortSignal): Promise<Status> {
    const res = await fetch(`/api/generate?app=${encodeURIComponent(target)}`, { cache: "no-store", signal });
    return (await res.json()) as Status;
  }

  // Watches a run that's already going (started earlier from this or another
  // browser) by polling its saved progress, then opens the guide once saved.
  async function follow(target: string, ctrl = reset(target)) {
    try {
      for (;;) {
        const s = await status(target, ctrl.signal);
        if (s.state === "saved") return router.push(s.href);
        if (s.state === "none") {
          return setError("The research stopped before a guide was saved. Search for the app again to start a new run.");
        }
        setLines(s.lines);
        setStage((s.stage as Stage | null) ?? "searching");
        setStartedAt(s.startedAt);
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (ctrl.signal.aborted) return;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Lost the connection while following the research. Reload to check on it.");
    } finally {
      if (!ctrl.signal.aborted) setRunning(false);
    }
  }

  // Opens a run already in progress if there is one, otherwise starts one.
  async function open(target: string) {
    const ctrl = reset(target);
    try {
      const s = await status(target, ctrl.signal);
      if (s.state === "running") return follow(target, ctrl);
    } catch {
      // The status check is a shortcut; fall through to a normal start.
    }
    return start(target, ctrl);
  }

  function handle(e: TraceEvent) {
    setLines((prev) => reduceTrace(prev, e));
    switch (e.type) {
      case "stage":
        return setStage(e.stage);
      case "saved":
        if (e.origin === "library") return router.push(e.href);
        setGuide(e.guide);
        return setNotice({
          tone: "info",
          title: `${e.guide.name} was already researched on ${formatDate(e.guide.researchedOn)}`,
          body: "You're seeing the saved guide, so this didn't use a research run. Everyone who asks for this app gets the same version.",
          href: e.href,
        });
      case "guide":
        setGuide(e.guide);
        setRuns(e.runsLeft);
        setSavedList((prev) => [
          { slug: e.guide.slug, name: e.guide.name, researchedOn: e.guide.researchedOn, difficulty: e.guide.verdict.difficulty },
          ...prev.filter((s) => s.slug !== e.guide.slug),
        ]);
        return setNotice({
          tone: "info",
          title: `Saved: ${e.guide.name}`,
          body: "This guide now has its own page. Anyone who asks for this app from now on gets it instantly, without a new run.",
          href: e.href,
        });
      case "limit":
        setRuns(0);
        return setNotice({ tone: "stop", title: "You've used your live research run", body: e.message });
      case "error":
        return setError(e.message);
    }
  }

  async function start(target: string, ctrl = reset(target)) {
    let busy = false;
    const refresh = refreshPending.current && target === initial;
    refreshPending.current = false;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: target, fp: await browserFingerprint(), refresh }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error(`Request failed (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const raw = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!raw) continue;
          const e = JSON.parse(raw) as TraceEvent;
          if (e.type === "busy") busy = true;
          else handle(e);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // The run carries on server-side, so pick it up from its saved progress.
        return follow(target);
      }
    } finally {
      if (!busy && !ctrl.signal.aborted) setRunning(false);
    }
    if (busy) return follow(target);
  }

  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      open(initial);
    }
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const researched = stage !== null;
  const counts = traceCounts(lines);

  return (
    <div className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Research an app</h1>
      <p className="mt-2 max-w-[62ch] text-muted">
        An agent searches the provider&rsquo;s developer docs, opens the pages that matter, and writes a guide in the same
        format as the library. A fact is only marked confirmed if the agent opened the page it cites.
      </p>
      <div className="mt-6 max-w-xl">
        <ResearchForm key={app} known={known} initial={app} onSubmit={open} />
        <p className={`mt-2 text-sm ${runs === 0 ? "text-customer" : "text-muted"}`}>{runsText(runs, runLimit)}</p>
      </div>

      {running && !researched && (
        <p className="mt-8 text-sm text-muted" aria-live="polite">Checking saved guides…</p>
      )}

      {researched && !guide && (
        <section aria-live="polite" className="card mt-8 max-w-3xl p-4 sm:p-5">
          {running && <div className="progress-line -mt-1 mb-4" aria-hidden />}
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <StageTracker stage={stage} />
            <span className="text-sm text-muted tabular-nums">{elapsed}s</span>
          </div>
          <p className="mt-3 text-[13px] text-muted tabular-nums">
            {counts.searches} {counts.searches === 1 ? "search" : "searches"} · {counts.read} {counts.read === 1 ? "page" : "pages"} read
            {counts.missed > 0 && ` · ${counts.missed} couldn't be opened`}
          </p>
          <div className="mt-4 border-t border-line pt-4">
            <ResearchLog lines={lines} running={running} />
          </div>
          {running && (
            <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
              You can leave this page. The research carries on, and coming back to{" "}
              <span className="text-ink">Research an app</span> shows it here until the guide is saved.
            </p>
          )}
        </section>
      )}

      {running && (stage === "writing" || stage === "checking") && <StripSkeleton />}

      {notice && (
        <div
          role={notice.tone === "stop" ? "alert" : "status"}
          className="mt-6 max-w-3xl text-sm"
        >
          <p className={`font-semibold ${notice.tone === "stop" ? "text-provider" : "text-ink"}`}>{notice.title}</p>
          <p className="mt-1">{notice.body}</p>
          {notice.href && (
            <p className="mt-2">
              <Link href={notice.href} className="underline underline-offset-2">Open its page</Link>
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 max-w-3xl text-sm">
          <p className="font-semibold text-customer">The guide couldn&rsquo;t be generated.</p>
          <p className="mt-1">{error}</p>
          <p className={`mt-2 text-muted ${error.includes("isn't set up") ? "hidden" : ""}`}>
            Try the provider&rsquo;s website instead of its name, or browse the <Link href="/" className="underline">library</Link>.
          </p>
        </div>
      )}

      {guide && (
        <div className="mt-4">
          {researched && lines.length > 0 && (
            <details className="max-w-3xl text-sm">
              <summary className="cursor-pointer">
                <span className="font-medium">How the agent got here</span>{" "}
                <span className="text-muted">
                  (<ResearchLogSummary lines={lines} />, {elapsed}s)
                </span>
              </summary>
              <div className="mt-3 border-t border-line pt-3">
                <ResearchLog lines={lines} />
              </div>
            </details>
          )}
          <GuideView guide={guide} actions={<GuideActions guide={guide} />} />
        </div>
      )}

      {!guide && !researched && !running && inProgress.length > 0 && (
        <section aria-labelledby="now-h" className="mt-10 max-w-xl">
          <h2 id="now-h" className="text-lg font-semibold tracking-tight">Researching now</h2>
          <ul className="card mt-3 p-2">
            {inProgress.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => follow(r.app)}
                  className="lift flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-3 py-2.5 text-left"
                >
                  <span className="font-medium">{r.app}</span>
                  <span className="flex items-center gap-3 text-[13px]">
                    <span className="text-muted">{STAGES.find((s) => s.id === r.stage)?.label ?? "Starting"}</span>
                    <span className="font-medium underline underline-offset-2">Watch</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!guide && !researched && (
        <div className="mt-14 grid max-w-5xl gap-12 lg:grid-cols-2">
          <section aria-labelledby="saved-h">
            <h2 id="saved-h" className="text-lg font-semibold tracking-tight">
              Already researched
            </h2>
            {savedList.length ? (
              <ul className="card mt-3 p-2">
                {savedList.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/g/${s.slug}`} className="lift flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg px-3 py-2.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="flex items-center gap-2 text-[13px] text-muted">
                        <DifficultyDots value={s.difficulty} /> {formatDate(s.researchedOn)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Nothing yet. The first app someone researches is saved here, and opens instantly for everyone after that.
              </p>
            )}
          </section>
          {sample && (
            <section aria-labelledby="sample-h">
              <h2 id="sample-h" className="text-lg font-semibold tracking-tight">
                What a run looks like
              </h2>
              <p className="mt-3 text-[13px] text-muted">
                The real log from researching{" "}
                <Link href={`/g/${sample.slug}`} className="underline underline-offset-2">{sample.name}</Link> on{" "}
                {formatDate(sample.researchedOn)}: <ResearchLogSummary lines={sample.log} />.
              </p>
              <div className="card mt-3 max-h-80 overflow-y-auto p-4">
                <ResearchLog lines={sample.log} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
