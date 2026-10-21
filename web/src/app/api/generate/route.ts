import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GuideContent, type Guide } from "@/lib/schema";
import { RESEARCH_SYSTEM, STRUCTURE_SYSTEM } from "@/lib/research-prompt";
import { enforceProvenance } from "@/lib/provenance";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.LIVE_MODEL ?? "claude-sonnet-5-5";
const MAX_PAUSES = 6;

export type TraceEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "results"; query: string; results: { title: string; url: string }[] }
  | { type: "fetch"; url: string }
  | { type: "fetched"; url: string; title: string | null }
  | { type: "fetch_error"; url: string; code: string }
  | { type: "provenance"; downgraded: number; opened: number }
  | { type: "guide"; guide: Guide }
  | { type: "error"; message: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function POST(req: Request) {
  const { app } = (await req.json().catch(() => ({}))) as { app?: string };
  const target = (app ?? "").trim().slice(0, 200);

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: TraceEvent) => controller.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      try {
        if (!target) return send({ type: "error", message: "Enter an app name or website." });
        if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
          return send({
            type: "error",
            message: "Live generation is not configured on this deployment: set ANTHROPIC_API_KEY on the server.",
          });
        }
        await run(target, send);
      } catch (err) {
        const message =
          err instanceof Anthropic.RateLimitError
            ? "The model is rate-limited right now. Try again in a minute."
            : err instanceof Anthropic.APIError
              ? `Model API error ${err.status ?? ""}: ${err.message}`
              : err instanceof Error
                ? err.message
                : "Unknown error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function run(target: string, send: (e: TraceEvent) => void) {
  const client = new Anthropic();
  const fetched = new Set<string>();
  const searched = new Set<string>();
  const pendingFetch = new Map<string, string>();
  const pendingSearch = new Map<string, string>();

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Research the OAuth app setup and approval path for: ${target}\nToday's date is ${new Date().toISOString().slice(0, 10)}.`,
    },
  ];

  send({ type: "status", message: `Researching ${target} with ${MODEL}` });

  let notes = "";
  for (let pauses = 0; ; pauses++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: RESEARCH_SYSTEM,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 8 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8, max_content_tokens: 20000 },
      ],
      messages,
    });

    stream.on("contentBlock", (block) => {
      if (block.type === "server_tool_use") {
        const input = block.input as { query?: string; url?: string };
        if (block.name === "web_search" && input.query) {
          pendingSearch.set(block.id, input.query);
          send({ type: "search", query: input.query });
        } else if (block.name === "web_fetch" && input.url) {
          pendingFetch.set(block.id, input.url);
          send({ type: "fetch", url: input.url });
        }
      } else if (block.type === "web_search_tool_result") {
        const query = pendingSearch.get(block.tool_use_id) ?? "";
        if (Array.isArray(block.content)) {
          const results = block.content.map((r) => ({ title: r.title, url: r.url }));
          results.forEach((r) => searched.add(r.url));
          send({ type: "results", query, results: results.slice(0, 5) });
        }
      } else if (block.type === "web_fetch_tool_result") {
        const url = pendingFetch.get(block.tool_use_id) ?? "";
        const content = block.content as
          | { type: "web_fetch_result"; url: string; content: { title?: string | null } }
          | { type: "web_fetch_tool_result_error"; error_code: string };
        if (content.type === "web_fetch_result") {
          fetched.add(content.url);
          fetched.add(url);
          send({ type: "fetched", url: content.url, title: content.content?.title ?? null });
        } else {
          send({ type: "fetch_error", url, code: content.error_code });
        }
      }
    });

    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (message.stop_reason === "pause_turn" && pauses < MAX_PAUSES) {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    notes = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    break;
  }

  if (!notes.trim()) throw new Error("Research finished without notes; try again or give the app's website.");

  send({ type: "status", message: `Read ${fetched.size} pages. Structuring the guide` });

  const today = new Date().toISOString().slice(0, 10);
  const parsed = await client.messages.parse({
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort: "low", format: zodOutputFormat(GuideContent) },
    system: STRUCTURE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `App requested: ${target}\nToday: ${today}\n\nPages the agent opened:\n${[...fetched].join("\n") || "(none)"}\n\nResearch notes:\n${notes}`,
      },
    ],
  });
  if (parsed.stop_reason === "refusal" || !parsed.parsed_output) {
    throw new Error("Could not structure the research into a guide.");
  }

  const content = parsed.parsed_output;
  const downgraded = enforceProvenance(content, fetched, searched);
  send({ type: "provenance", downgraded, opened: fetched.size });
  if (downgraded > 0) {
    content.unknowns.push(
      `${downgraded} claim(s) were downgraded automatically because their cited page was not opened during research.`,
    );
  }

  const guide: Guide = {
    ...content,
    slug: `${slugify(content.name || target)}-live`,
    origin: "live",
    researchedOn: today,
    model: MODEL,
    verification: null,
  };
  send({ type: "guide", guide });
}
