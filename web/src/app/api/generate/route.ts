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
  dailyLeft,
  getSaved,
  recordRun,
  releaseLock,
  runsLeft,
  saveGuide,
  visitorFrom,
  RUN_LIMIT,
} from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { app, fp } = (await req.json().catch(() => ({}))) as { app?: string; fp?: string | null };
  const target = (app ?? "").trim().slice(0, 200);

  const jar = await cookies();
  let cookieId = jar.get(VISITOR_COOKIE)?.value;
  const newCookie = !cookieId;
  cookieId ??= crypto.randomUUID();
  const visitor = visitorFrom(cookieId, fp);

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: TraceEvent) => controller.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      const key = appKey(target);
      let locked = false;
      let charged = false;
      try {
        if (!target || !key) return send({ type: "error", message: "Enter an app name or website." });

        const lib = getGuide(key);
        if (lib) return send({ type: "saved", guide: lib, href: `/guides/${lib.slug}`, origin: "library" });
        const saved = await getSaved(key);
        if (saved) return send({ type: "saved", guide: saved, href: `/g/${key}`, origin: "live" });

        if (!searchConfigured() || !writerConfigured()) {
          return send({
            type: "error",
            message:
              "Live research isn't set up on this deployment yet. It needs a search key (TAVILY_API_KEY or SERPER_API_KEY) and a writer key (GEMINI_API_KEY). The library and saved guides still work.",
          });
        }
        if ((await runsLeft(visitor)) <= 0) {
          return send({
            type: "limit",
            message: `Each browser gets ${RUN_LIMIT === 1 ? "one live research run" : `${RUN_LIMIT} live research runs`}, and this one has used ${RUN_LIMIT === 1 ? "it" : "them"}. Saved guides and the library stay open.`,
          });
        }
        if ((await dailyLeft()) <= 0) {
          return send({
            type: "limit",
            message: "Today's free research capacity is used up. It resets at midnight UTC. Saved guides and the library stay open.",
          });
        }
        if (!(locked = await acquireLock(key))) {
          return send({ type: "busy", message: `Someone is researching ${target} right now. Its guide will be saved here in a minute or two.` });
        }

        await recordRun(visitor, 1);
        charged = true;
        let log: TraceLine[] = [];
        const guide = await researchApp(target, key, (e) => {
          log = reduceTrace(log, e);
          send(e);
        });
        guide.researchLog = log;
        await saveGuide(guide);
        send({ type: "stage", stage: "done" });
        const left = await runsLeft(visitor);
        send({ type: "guide", guide, href: `/g/${key}`, runsLeft: Number.isFinite(left) ? left : null });
      } catch (err) {
        if (charged) await recordRun(visitor, -1);
        console.error(`[generate] ${key}:`, err);
        const reason = err instanceof Error ? err.message : "Something went wrong.";
        send({ type: "error", message: charged ? `${reason} This attempt didn't use up your run.` : reason });
      } finally {
        if (locked) await releaseLock(key);
        controller.close();
      }
    },
  });

  const resHeaders = new Headers({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
  if (newCookie) {
    resHeaders.append(
      "Set-Cookie",
      `${VISITOR_COOKIE}=${cookieId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.VERCEL ? "; Secure" : ""}`,
    );
  }
  return new Response(body, { headers: resHeaders });
}
