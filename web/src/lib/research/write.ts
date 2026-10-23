import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GuideContent } from "../schema";

// The model writes everything except sources; sources come from the pages we
// actually read, so the model can only cite ids we hand it.
export const WriterContent = GuideContent.omit({ sources: true });
export type WriterContent = z.infer<typeof WriterContent>;

export const GEMINI_MODELS = (process.env.GEMINI_MODELS ?? "gemini-3.6-flash,gemini-3.8-flash,gemini-3.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5";

// Free NVIDIA NIM models tried after Gemini, best first. Set NVIDIA_MODELS to change them.
// Checked 23 Oct 2026: many models NVIDIA lists return 404 on the free endpoint.
const NVIDIA_DEFAULT = "nvidia/nemotron-3-ultra-550b-a55b,z-ai/glm-5.3";

export const writerConfigured = () => !!process.env.GEMINI_API_KEY || !!process.env.NVIDIA_API_KEY || !!process.env.ANTHROPIC_API_KEY;

// Gemini accepts a JSON Schema subset: nullable is written as a type array,
// and $schema is not expected.
function geminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(geminiSchema);
  if (!node || typeof node !== "object") return node;
  const obj = { ...(node as Record<string, unknown>) };
  delete obj.$schema;
  for (const k of ["minimum", "maximum"]) if (typeof obj[k] === "number" && Math.abs(obj[k] as number) > 1e9) delete obj[k];
  const any = obj.anyOf as Record<string, unknown>[] | undefined;
  if (any && any.length === 2 && any.some((s) => s.type === "null")) {
    const other = geminiSchema(any.find((s) => s.type !== "null")) as Record<string, unknown>;
    delete obj.anyOf;
    return { ...obj, ...other, type: [other.type, "null"] };
  }
  for (const k of Object.keys(obj)) obj[k] = geminiSchema(obj[k]);
  return obj;
}

const schemaFor = (zod: z.ZodType) => geminiSchema(z.toJSONSchema(zod));

class SchemaRejected extends Error {}
class Overloaded extends Error {}

async function callGemini(model: string, system: string, prompt: string, schema: unknown, withSchema: boolean): Promise<string> {
  const generationConfig: Record<string, unknown> = { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16384 };
  if (withSchema) generationConfig.responseJsonSchema = schema;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: withSchema ? prompt : `${prompt}\n\nReturn JSON matching this JSON Schema exactly:\n${JSON.stringify(schema)}` }] }],
      generationConfig,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: { code?: number; status?: string; message?: string };
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  };
  if (!res.ok) {
    const msg = body.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 400 && withSchema && /schema/i.test(msg)) throw new SchemaRejected(msg);
    if (res.status === 503) throw new Overloaded(`${model}: overloaded (${msg.slice(0, 80)})`);
    throw new Error(`${model}: ${body.error?.status ?? res.status} ${msg.slice(0, 160)}`);
  }
  const cand = body.candidates?.[0];
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`${model}: empty response (${cand?.finishReason ?? "no candidate"})`);
  return text;
}

// A 503 means the model is briefly overloaded, so it's worth one retry;
// a 429 means the free quota is used up, so move straight to the next model.
async function callWithRetry(model: string, system: string, prompt: string, schema: unknown, withSchema: boolean) {
  try {
    return await callGemini(model, system, prompt, schema, withSchema);
  } catch (err) {
    if (!(err instanceof Overloaded)) throw err;
    await new Promise((r) => setTimeout(r, 4000));
    return callGemini(model, system, prompt, schema, withSchema);
  }
}

async function viaGemini<T>(model: string, system: string, prompt: string, zod: z.ZodType<T>): Promise<T> {
  const schema = schemaFor(zod);
  let raw: string;
  try {
    raw = await callWithRetry(model, system, prompt, schema, true);
  } catch (err) {
    if ((err as Error).name === "TimeoutError") throw new Error(`${model}: no answer within 45 seconds`);
    if (!(err instanceof SchemaRejected)) throw err;
    raw = await callWithRetry(model, system, prompt, schema, false);
  }
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const parsed = zod.safeParse(JSON.parse(cleaned));
  if (!parsed.success) throw new Error(`${model}: output didn't match the guide format (${parsed.error.issues[0]?.path.join(".")})`);
  return parsed.data;
}

// Free backups that speak the OpenAI chat format. Each is used only when its key
// is set. Groq's free tier allows 8,000 tokens a minute, too few for a whole
// guide, so it only does the small headline check.
type Compat = { name: string; base: string; key?: string; models: string[]; tasks: Task[]; jsonMode: boolean; timeoutMs: number };
export type Task = "write" | "check";
const list = (env: string | undefined, fallback: string) => (env ?? fallback).split(",").map((m) => m.trim()).filter(Boolean);
const COMPAT: Compat[] = [
  {
    name: "NVIDIA",
    base: "https://integrate.api.nvidia.com/v1",
    key: process.env.NVIDIA_API_KEY,
    models: list(process.env.NVIDIA_MODELS, NVIDIA_DEFAULT),
    tasks: ["write", "check"],
    jsonMode: false,
    timeoutMs: 200_000,
  },
  {
    name: "Groq",
    base: "https://api.groq.com/openai/v1",
    key: process.env.GROQ_API_KEY,
    models: list(process.env.GROQ_MODELS, "qwen/qwen3.8-27b"),
    tasks: ["check"],
    jsonMode: true,
    timeoutMs: 45_000,
  },
];

// Reasoning models may wrap the answer in <think> blocks or code fences.
function extractJson(text: string): unknown {
  const t = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(t.slice(start, end + 1));
}

// Streams the reply, so a slow but steady model can finish a long guide: it
// fails only if nothing arrives for IDLE_MS, or the run's finish time is reached.
const IDLE_MS = 30_000;

async function viaCompat<T>(p: Compat, model: string, system: string, prompt: string, zod: z.ZodType<T>, finishBy: number): Promise<T> {
  const schema = JSON.stringify(schemaFor(zod));
  const ctrl = new AbortController();
  let why = "";
  const stop = (reason: string) => {
    why = reason;
    ctrl.abort();
  };
  const hardMs = Math.min(p.timeoutMs, finishBy - Date.now());
  if (hardMs < 15_000) throw new Error(`${model}: not enough time left to try`);
  const hard = setTimeout(() => stop(`not finished within ${Math.round(hardMs / 1000)} seconds`), hardMs);
  let idle = setTimeout(() => stop(`no answer for ${IDLE_MS / 1000} seconds`), IDLE_MS);
  const touch = () => {
    clearTimeout(idle);
    idle = setTimeout(() => stop(`stopped sending for ${IDLE_MS / 1000} seconds`), IDLE_MS);
  };

  let text = "";
  try {
    const res = await fetch(`${p.base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 16384,
        stream: true,
        ...(p.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${prompt}\n\nReturn only a JSON object matching this JSON Schema exactly, with no other text:\n${schema}` },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } | string; detail?: string };
      const msg = typeof body.error === "string" ? body.error : (body.error?.message ?? body.detail ?? `HTTP ${res.status}`);
      throw new Error(`${model}: ${res.status === 429 ? "rate limit or quota reached" : res.status} ${msg.slice(0, 140)}`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      touch();
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          text += (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content ?? "";
        } catch {
          // A keep-alive or partial line; the next chunk completes it.
        }
      }
    }
  } catch (err) {
    if (why) throw new Error(`${model}: ${why}`);
    throw err;
  } finally {
    clearTimeout(hard);
    clearTimeout(idle);
  }
  if (!text) throw new Error(`${model}: empty response`);
  let json: unknown;
  try {
    json = extractJson(text);
  } catch {
    throw new Error(`${model}: reply wasn't valid JSON`);
  }
  const parsed = zod.safeParse(json);
  if (!parsed.success) throw new Error(`${model}: output didn't match the guide format (${parsed.error.issues[0]?.path.join(".")})`);
  return parsed.data;
}

async function viaClaude<T>(system: string, prompt: string, zod: z.ZodType<T>): Promise<T> {
  const client = new Anthropic();
  const res = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 32000,
    output_config: { effort: "low", format: zodOutputFormat(zod) },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(`${CLAUDE_MODEL}: no usable output`);
  return res.parsed_output;
}

// Tries each model in turn: a quota error or bad output on one moves to the next.
// No new attempt starts after `startBy` (a timestamp), because one attempt can
// take about 95 s and the route is stopped at 300 s with nothing saved.
export async function generateJson<T>(
  zod: z.ZodType<T>,
  system: string,
  prompt: string,
  onAttempt: (model: string, error?: string) => void,
  startBy = Infinity,
  task: Task = "write",
): Promise<{ content: T; model: string }> {
  // A streamed attempt may run past startBy, but must end by here (the route stops at 300 s).
  const finishBy = startBy + 80_000;
  const attempts: { model: string; run: () => Promise<T> }[] = [];
  const compat = COMPAT.filter((p) => p.key && p.tasks.includes(task));
  // The small check goes to Groq first, so it doesn't spend the writer's Gemini quota.
  if (task === "check") for (const p of compat.filter((c) => c.name === "Groq")) for (const m of p.models) attempts.push({ model: m, run: () => viaCompat(p, m, system, prompt, zod, finishBy) });
  // Order: the main Gemini models, then the free backups, then Gemini's lightest
  // model last, since it writes the thinnest guides (the Dropbox headline slip).
  const gemini = process.env.GEMINI_API_KEY ? GEMINI_MODELS : [];
  const lightest = gemini.length > 2 ? gemini.slice(-1) : [];
  for (const m of gemini.slice(0, gemini.length - lightest.length)) attempts.push({ model: m, run: () => viaGemini(m, system, prompt, zod) });
  for (const p of compat.filter((c) => task === "write" || c.name !== "Groq")) for (const m of p.models) attempts.push({ model: m, run: () => viaCompat(p, m, system, prompt, zod, finishBy) });
  for (const m of lightest) attempts.push({ model: m, run: () => viaGemini(m, system, prompt, zod) });
  if (process.env.ANTHROPIC_API_KEY) attempts.push({ model: CLAUDE_MODEL, run: () => viaClaude(system, prompt, zod) });

  const errors: string[] = [];
  for (const a of attempts) {
    if (Date.now() > startBy) {
      errors.push("out of time before trying the next model");
      break;
    }
    onAttempt(a.model);
    try {
      return { content: await a.run(), model: a.model };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      onAttempt(a.model, msg);
    }
  }
  throw new Error(`Every writer model failed. ${errors.join(" | ").slice(0, 400)}`);
}

export const writeGuide = (system: string, prompt: string, onAttempt: (model: string, error?: string) => void, startBy?: number) =>
  generateJson(WriterContent, system, prompt, onAttempt, startBy);
