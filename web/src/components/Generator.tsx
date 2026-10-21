"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Guide } from "@/lib/schema";
import type { TraceEvent } from "@/app/api/generate/route";
import { ResearchForm, type KnownApp } from "./ResearchForm";
import { GuideView } from "./GuideView";
import { GuideActions } from "./GuideActions";

type Line = { kind: "search" | "read" | "miss" | "note" | "warn"; text: string; detail?: string; href?: string };

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export function Generator({ known, initial }: { known: KnownApp[]; initial: string }) {
  const [app, setApp] = useState(initial);
  const [lines, setLines] = useState<Line[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running]);

  async function start(target: string) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setApp(target);
    setLines([]);
    setGuide(null);
    setError(null);
    setElapsed(0);
    setRunning(true);
    history.replaceState(null, "", `/generate?app=${encodeURIComponent(target)}`);

    const push = (l: Line) => setLines((prev) => [...prev, l]);
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
          if (!raw) continue;
          const e = JSON.parse(raw) as TraceEvent;
          if (e.type === "status") push({ kind: "note", text: e.message });
          else if (e.type === "search") push({ kind: "search", text: `Searched “${e.query}”` });
          else if (e.type === "results")
            setLines((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--)
                if (copy[i].kind === "search" && copy[i].text.includes(e.query) && !copy[i].detail) {
                  copy[i] = { ...copy[i], detail: `${e.results.length ? e.results.map((r) => host(r.url)).filter((v, j, a) => a.indexOf(v) === j).slice(0, 4).join(", ") : "no results"}` };
                  break;
                }
              return copy;
            });
          else if (e.type === "fetch") push({ kind: "read", text: `Opening ${host(e.url)}`, href: e.url });
          else if (e.type === "fetched")
            setLines((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--)
                if (copy[i].kind === "read" && copy[i].text.startsWith("Opening")) {
                  copy[i] = { kind: "read", text: `Read ${e.title ?? host(e.url)}`, detail: host(e.url), href: e.url };
                  break;
                }
              return copy;
            });
          else if (e.type === "fetch_error")
            setLines((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--)
                if (copy[i].kind === "read" && copy[i].text.startsWith("Opening")) {
                  copy[i] = { kind: "miss", text: `Couldn't open ${host(e.url)}`, detail: e.code.replace(/_/g, " "), href: e.url };
                  break;
                }
              return copy;
            });
          else if (e.type === "provenance")
            push({
              kind: e.downgraded ? "warn" : "note",
              text: e.downgraded
                ? `Provenance check: ${e.downgraded} claim(s) downgraded because their page wasn't opened`
                : `Provenance check passed: every "confirmed" claim cites a page the agent opened (${e.opened} pages)`,
            });
          else if (e.type === "guide") setGuide(e.guide);
          else if (e.type === "error") setError(e.message);
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

  return (
    <div className="pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Research an app</h1>
      <p className="mt-2 max-w-[62ch] text-muted">
        An agent searches the provider&rsquo;s developer docs, opens the pages that matter, and writes a guide in the
        same format as the library. Claims are only marked confirmed if the agent opened the page they cite.
      </p>
      <div className="mt-6 max-w-xl">
        <ResearchForm key={app} known={known} initial={app} onSubmit={start} />
      </div>

      {(running || lines.length > 0) && (
        <section aria-live="polite" className="mt-8 max-w-3xl rounded-md border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-semibold">{running ? `Researching ${app}` : `Research log for ${app}`}</h2>
            <span className="text-sm text-muted">{elapsed}s</span>
          </div>
          <ol className="mt-3 space-y-1.5 text-sm">
            {lines.map((l, i) => (
              <li key={i} className={`grid grid-cols-[1.25rem_1fr] ${l.kind === "miss" || l.kind === "warn" ? "text-customer" : ""}`}>
                <span aria-hidden className="text-muted">{icon[l.kind]}</span>
                <span>
                  {l.href ? <a href={l.href} target="_blank" rel="noreferrer" className="hover:underline">{l.text}</a> : l.text}
                  {l.detail && <span className="text-muted"> · {l.detail}</span>}
                </span>
              </li>
            ))}
            {running && (
              <li className="grid grid-cols-[1.25rem_1fr] text-muted">
                <span aria-hidden className="animate-pulse">●</span>
                <span>Working…</span>
              </li>
            )}
          </ol>
        </section>
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
        <div className="mt-6">
          <p className="max-w-3xl text-sm text-muted">
            This guide was written just now by an agent and hasn&rsquo;t been checked by a person. Treat unconfirmed items
            as leads, not facts. Share it with the link below: the guide is stored in the link itself.
          </p>
          <GuideActions guide={guide} />
          <GuideView guide={guide} />
        </div>
      )}
    </div>
  );
}
