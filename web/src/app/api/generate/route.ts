import { after } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { VISITOR_COOKIE } from "@/lib/visitor";
import { reduceTrace, type TraceEvent, type TraceLine } from "@/lib/trace";
import { getGuide } from "@/guides";
import { researchApp } from "@/lib/research/pipeline";
import { searchConfigured } from "@/lib/research/search";
import { writerConfigured } from "@/lib/research/write";
import {
  acquireLock,
  appKey,
  canRefresh,
  dailyLeft,
  endProgress,
  getProgress,
  getSaved,
  putProgress,
  recordRun,
  releaseLock,
  runsLeft,
  saveGuide,
  visitorFrom,
  RUN_LIMIT,
  type Progress,
} from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// Where a research run stands, so a page can follow it after reloading or
// coming back: saved, running (with its log so far), or not started.
export async function GET(req: Request) {
  const key = appKey(new URL(req.url).searchParams.get("app") ?? "");
  const headers = { "Cache-Control": "no-store" };
  if (!key) return Response.json({ state: "none" }, { headers });
  const lib = getGuide(key);
  if (lib) return Response.json({ state: "saved", href: `/guides/${lib.slug}` }, { headers });
  // A run in progress wins over a saved guide, since a refresh runs while the old version is still saved.
  const p = await getProgress(key);
  if (p) return Response.json({ state: "running", ...p }, { headers });
  if (await getSaved(key)) return Response.json({ state: "saved", href: `/g/${key}` }, { headers });
  return Response.json({ state: "none" }, { headers });
}

export async function POST(req: Request) {
  const { app, fp, refresh, reviewer } = (await req.json().catch(() => ({}))) as { app?: string; fp?: string | null; refresh?: boolean; reviewer?: string };
  const target = (app ?? "").trim().slice(0, 200);

  const jar = await cookies();
  let cookieId = jar.get(VISITOR_COOKIE)?.value;
  const newCookie = !cookieId;
  cookieId ??= crypto.randomUUID();
  const visitor = visitorFrom(cookieId, fp);
  // A secret link (?reviewer=<REVIEWER_KEY>) lets a reviewer run unfamiliar apps without the
  // per-browser or daily limits. Without REVIEWER_KEY set, nothing is bypassed.
  const expected = process.env.REVIEWER_KEY;
  const free =
    !!expected &&
    typeof reviewer === "string" &&
    reviewer.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(reviewer), Buffer.from(expected));

  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let open = true;
  const body = new ReadableStream<Uint8Array>({
    start: (c) => void (controller = c),
    // The browser left. The run carries on and keeps saving its progress.
    cancel: () => void (open = false),
  });
  const send = (e: TraceEvent) => {
    if (!open) return;
    try {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
    } catch {
      open = false;
    }
  };

  const job = (async () => {
    const key = appKey(target);
    let locked = false;
    let charged = false;
    try {
      if (!target || !key) return send({ type: "error", message: "Enter an app name or website." });

      const lib = getGuide(key);
      if (lib) return send({ type: "saved", guide: lib, href: `/guides/${lib.slug}`, origin: "library" });
      const saved = await getSaved(key);
      // A saved guide is served as is, unless the visitor asked to redo one that's old enough.
      if (saved && !(refresh && canRefresh(saved))) return send({ type: "saved", guide: saved, href: `/g/${key}`, origin: "live" });

      if (!searchConfigured() || !writerConfigured()) {
        return send({
          type: "error",
          message:
            "Live research isn't set up on this deployment yet. It needs a search key (TAVILY_API_KEY or SERPER_API_KEY) and a writer key (GEMINI_API_KEY). The library and saved guides still work.",
        });
      }
      if (!free && (await runsLeft(visitor)) <= 0) {
        return send({
          type: "limit",
          message: `Each browser gets ${RUN_LIMIT} live research ${RUN_LIMIT === 1 ? "run" : "runs"}, and this one has used ${RUN_LIMIT === 1 ? "it" : "them"}. Saved guides and the library stay open.`,
        });
      }
      if (!free && (await dailyLeft()) <= 0) {
        return send({
          type: "limit",
          message: "Today's free research capacity is used up. It resets at midnight UTC. Saved guides and the library stay open.",
        });
      }
      if (!(locked = await acquireLock(key))) {
        return send({ type: "busy", message: `Someone is researching ${target} right now. Its guide will be saved here in a minute or two.` });
      }

      if (!free) await recordRun(visitor, 1);
      charged = true;
      const progress: Progress = { key, app: target, stage: null, startedAt: Date.now(), lines: [] };
      // Progress writes are chained so they land in order, and never block the run.
      let saving = putProgress(progress).catch(() => {});
      const guide = await researchApp(target, key, (e) => {
        progress.lines = reduceTrace(progress.lines, e);
        if (e.type === "stage") progress.stage = e.stage;
        const snapshot = { ...progress };
        saving = saving.then(() => putProgress(snapshot)).catch(() => {});
        send(e);
      });
      guide.researchLog = progress.lines as TraceLine[];
      await saveGuide(guide);
      await saving;
      send({ type: "stage", stage: "done" });
      const left = await runsLeft(visitor);
      send({ type: "guide", guide, href: `/g/${key}`, runsLeft: Number.isFinite(left) ? left : null });
    } catch (err) {
      if (charged && !free) await recordRun(visitor, -1);
      console.error(`[generate] ${key}:`, err);
      const reason = err instanceof Error ? err.message : "Something went wrong.";
      send({ type: "error", message: charged && !free ? `${reason} This attempt didn't use up your run.` : reason });
    } finally {
      if (charged) await endProgress(key).catch(() => {});
      if (locked) await releaseLock(key);
      if (open) controller.close();
    }
  })();
  // Keeps the function alive until the run finishes, even if the response has closed.
  after(job);

  const resHeaders = new Headers({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
  if (newCookie) {
    resHeaders.append(
      "Set-Cookie",
      `${VISITOR_COOKIE}=${cookieId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.VERCEL ? "; Secure" : ""}`,
    );
  }
  return new Response(body, { headers: resHeaders });
}
