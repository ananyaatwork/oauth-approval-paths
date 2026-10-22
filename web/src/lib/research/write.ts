import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GuideContent } from "../schema";

// The model writes everything except sources; sources come from the pages we
// actually read, so the model can only cite ids we hand it.
export const WriterContent = GuideContent.omit({ sources: true });
export type WriterContent = z.infer<typeof WriterContent>;

const GEMINI_MODELS = (process.env.GEMINI_MODELS ?? "gemini-3.8-flash,gemini-3.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5";

export const writerConfigured = () => !!process.env.GEMINI_API_KEY || !!process.env.ANTHROPIC_API_KEY;

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

const SCHEMA = geminiSchema(z.toJSONSchema(WriterContent));

class SchemaRejected extends Error {}

async function callGemini(model: string, system: string, prompt: string, withSchema: boolean): Promise<string> {
  const generationConfig: Record<string, unknown> = { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16384 };
  if (withSchema) generationConfig.responseJsonSchema = SCHEMA;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: withSchema ? prompt : `${prompt}\n\nReturn JSON matching this JSON Schema exactly:\n${JSON.stringify(SCHEMA)}` }] }],
      generationConfig,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: { code?: number; status?: string; message?: string };
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  };
  if (!res.ok) {
    const msg = body.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 400 && withSchema && /schema/i.test(msg)) throw new SchemaRejected(msg);
    throw new Error(`${model}: ${body.error?.status ?? res.status} ${msg.slice(0, 160)}`);
  }
  const cand = body.candidates?.[0];
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`${model}: empty response (${cand?.finishReason ?? "no candidate"})`);
  return text;
}

async function viaGemini(model: string, system: string, prompt: string): Promise<WriterContent> {
  let raw: string;
  try {
    raw = await callGemini(model, system, prompt, true);
  } catch (err) {
    if (!(err instanceof SchemaRejected)) throw err;
    raw = await callGemini(model, system, prompt, false);
  }
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const parsed = WriterContent.safeParse(JSON.parse(cleaned));
  if (!parsed.success) throw new Error(`${model}: output didn't match the guide format (${parsed.error.issues[0]?.path.join(".")})`);
  return parsed.data;
}

async function viaClaude(system: string, prompt: string): Promise<WriterContent> {
  const client = new Anthropic();
  const res = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 32000,
    output_config: { effort: "low", format: zodOutputFormat(WriterContent) },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(`${CLAUDE_MODEL}: no usable output`);
  return res.parsed_output;
}

// Tries each model in turn: a quota error or bad output on one moves to the next.
export async function writeGuide(
  system: string,
  prompt: string,
  onAttempt: (model: string, error?: string) => void,
): Promise<{ content: WriterContent; model: string }> {
  const attempts: { model: string; run: () => Promise<WriterContent> }[] = [];
  if (process.env.GEMINI_API_KEY) for (const m of GEMINI_MODELS) attempts.push({ model: m, run: () => viaGemini(m, system, prompt) });
  if (process.env.ANTHROPIC_API_KEY) attempts.push({ model: CLAUDE_MODEL, run: () => viaClaude(system, prompt) });

  const errors: string[] = [];
  for (const a of attempts) {
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
