"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Guide } from "@/lib/schema";
import type { TraceEvent } from "@/app/api/generate/route";
import { ResearchForm, type KnownApp } from "./ResearchForm";
import { GuideView } from "./GuideView";
import { GuideActions } from "./GuideActions";

type Line = { kind: "search" | "read" | "miss" | "note" | "warn"; text: string; detail?: string; href?: string };
type SavedItem = { slug: string; name: string; researchedOn: string; difficulty: number };
type Notice = { tone: "info" | "stop"; title: string; body: string; href?: string };

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

function runsText(left: number | null, limit: number) {
  if (left === null) return "Live research runs are unlimited on this deployment.";
  if (left === 0)
    return "You've used your live research run. Apps that are already researched still open instantly.";
  const n = left === 1 ? "one live research run" : `${left} live research runs`;
  return `You have ${n}${limit > left ? " left" : ""}. Apps that are already researched open instantly and don't use it.`;
}

export function Generator({
  known,
  saved,
  initial,
  runsLeft: initialRuns,
  runLimit,
}: {
  known: KnownApp[];
  saved: SavedItem[];
  initial: string;
  runsLeft: number | null;
  runLimit: number;
}) {
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [lines, setLines] = useState<Line[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [runs, setRuns] = useState(initialRuns);
  const [savedList, setSavedList] = useState(saved);
  const started = useRef(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const replaceLast = (pred: (l: Line) => boolean, next: (l: Line) => Line) =>
    setLines((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--)
        if (pred(copy[i])) {
          copy[i] = next(copy[i]);
          break;
        }
      return copy;
    });

  function handle(e: TraceEvent) {
    const push = (l: Line) => setLines((prev) => [...prev, l]);
    switch (e.type) {
      case "status":
        return push({ kind: "note", text: e.message });
      case "search":
        return push({ kind: "search", text: `Searched “${e.query}”` });
      case "results":
        return replaceLast(
          (l) => l.kind === "search" && l.text.includes(e.query) && !l.detail,
          (l) => ({
            ...l,
            detail: e.results.length ? [...new Set(e.results.map((r) => host(r.url)))].slice(0, 4).join(", ") : "no results",
          }),
        );
      case "fetch":
        return push({ kind: "read", text: `Opening ${host(e.url)}`, href: e.url });
      case "fetched":
        return replaceLast(
          (l) => l.kind === "read" && l.text.startsWith("Opening"),
          () => ({ kind: "read", text: `Read ${e.title ?? host(e.url)}`, detail: host(e.url), href: e.url }),
        );
      case "fetch_error":
        return replaceLast(
          (l) => l.kind === "read" && l.text.startsWith("Opening") && l.href === e.url,
          () => ({ kind: "miss", text: `Couldn't open ${host(e.url)}`, detail: e.code.replace(/_/g, " "), href: e.url }),
        );
      case "provenance":
        return push({
          kind: e.downgraded ? "warn" : "note",
          text: e.downgraded
            ? `Provenance check: ${e.downgraded} claim(s) downgraded because their page wasn't opened`
            : `Provenance check passed: every “confirmed” claim cites a page the agent opened (${e.opened} pages)`,
        });
      case "saved":
        if (e.origin === "library") return router.push(e.href);
        setGuide(e.guide);
        return setNotice({
          tone: "info",
          title: `${e.guide.name} was already researched on ${e.guide.researchedOn}`,
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
      case "busy":
        return setNotice({ tone: "stop", title: "Already being researched", body: e.message });
      case "error":
        return setError(e.message);
    }
  }

  async function start(target: string) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setApp(target);
    setLines([]);
    setGuide(null);
    setNotice(null);
    setError(null);
    setElapsed(0);
    setRunning(true);
    history.replaceState(null, "", `/generate?app=${encodeURIComponent(target)}`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: target }),
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
          if (raw) handle(JSON.parse(raw) as TraceEvent);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || "The connection dropped. Try again.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      start(initial);
    }
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon: Record<Line["kind"], string> = { search: "⌕", read: "↗", miss: "×", note: "·", warn: "!" };
  const showTrace = running || lines.length > 0;

  return (
    <div className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Research an app</h1>
      <p className="mt-2 max-w-[62ch] text-muted">
        An agent searches the provider&rsquo;s developer docs, opens the pages that matter, and writes a guide in the
        same format as the library. Claims are only marked confirmed if the agent opened the page they cite.
      </p>
      <div className="mt-6 max-w-xl">
        <ResearchForm key={app} known={known} initial={app} onSubmit={start} />
        <p className={`mt-2 text-sm ${runs === 0 ? "text-customer" : "text-muted"}`}>{runsText(runs, runLimit)}</p>
      </div>

      {showTrace && (
        <section aria-live="polite" className="mt-8 max-w-3xl rounded-md border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-semibold">{running ? `Researching ${app}` : `Research log for ${app}`}</h2>
            <span className="text-sm text-muted tabular-nums">{elapsed}s</span>
          </div>
          <ol className="mt-3 space-y-1.5 text-sm">
            {lines.map((l, i) => (
              <li key={i} className={`grid grid-cols-[1.25rem_minmax(0,1fr)] ${l.kind === "miss" || l.kind === "warn" ? "text-customer" : ""}`}>
                <span aria-hidden className="text-muted">{icon[l.kind]}</span>
                <span className="[overflow-wrap:anywhere]">
                  {l.href ? <a href={l.href} target="_blank" rel="noreferrer" className="hover:underline">{l.text}</a> : l.text}
                  {l.detail && <span className="text-muted"> · {l.detail}</span>}
                </span>
              </li>
            ))}
            {running && (
              <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-muted">
                <span aria-hidden className="animate-pulse">●</span>
                <span>{lines.length ? "Working…" : "Checking saved guides…"}</span>
              </li>
            )}
          </ol>
        </section>
      )}

      {notice && (
        <div
          role={notice.tone === "stop" ? "alert" : "status"}
          className={`mt-6 max-w-3xl border-l-4 bg-surface px-4 py-3 text-sm ${notice.tone === "stop" ? "border-provider" : "border-agent"}`}
        >
          <p className="font-medium">{notice.title}</p>
          <p className="mt-1">{notice.body}</p>
          {notice.href && (
            <p className="mt-2">
              <Link href={notice.href} className="underline underline-offset-2">Open its page</Link>
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 max-w-3xl border-l-4 border-customer bg-surface px-4 py-3 text-sm">
          <p className="font-medium">The guide couldn&rsquo;t be generated.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-muted">
            Try the provider&rsquo;s website instead of its name, or browse the <Link href="/" className="underline">library</Link>.
          </p>
        </div>
      )}

      {guide && (
        <div className="mt-2">
          <GuideActions guide={guide} />
          <GuideView guide={guide} />
        </div>
      )}

      {!guide && (
        <section className="mt-14 max-w-3xl" aria-labelledby="saved-h">
          <h2 id="saved-h" className="border-b border-line pb-2 text-lg font-semibold tracking-tight">
            Already researched
          </h2>
          {savedList.length ? (
            <ul className="mt-2">
              {savedList.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link href={`/g/${s.slug}`} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5 hover:bg-surface">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-muted tabular-nums">
                      Difficulty {s.difficulty}/5 · researched {s.researchedOn}
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
      )}
    </div>
  );
}
