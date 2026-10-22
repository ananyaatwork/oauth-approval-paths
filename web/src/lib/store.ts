import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Guide, type TraceLine } from "./schema";

// Saved live guides, per-app research locks and per-visitor run counts.
// Uses Upstash Redis (Vercel's "KV" integration) when its REST env vars are
// set, otherwise files under .data/ for local development.

const LOCK_TTL_S = 6 * 60;

// "Linear", "linear.app", "https://developers.linear.app/docs" -> "linear"
export function appKey(input: string): string {
  let s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  const host = s.split(/[/?#]/)[0];
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) {
    const parts = host.split(".");
    const secondLevel = parts.length > 2 && ["co", "com", "org", "net", "gov", "ac"].includes(parts[parts.length - 2]);
    s = parts[parts.length - (secondLevel ? 3 : 2)];
  }
  return s
    .replace(/\b(app|api|oauth|integration|developer|developers)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type SavedSummary = { slug: string; name: string; researchedOn: string; difficulty: number };

// A run in progress, saved as it goes so anyone (including the person who
// started it and then left) can follow it until the guide is saved.
export type Progress = { key: string; app: string; stage: string | null; startedAt: number; lines: TraceLine[] };

interface Backend {
  getGuide(key: string): Promise<unknown | null>;
  putGuide(key: string, guide: Guide): Promise<void>;
  listGuides(): Promise<unknown[]>;
  lock(key: string): Promise<boolean>;
  unlock(key: string): Promise<void>;
  runs(id: string): Promise<number>;
  addRuns(id: string, delta: number): Promise<void>;
  getProgress(key: string): Promise<Progress | null>;
  putProgress(p: Progress): Promise<void>;
  endProgress(key: string): Promise<void>;
  listProgress(): Promise<Progress[]>;
}

// Vercel's Upstash integration names these KV_REST_API_* by default, or
// <PREFIX>_KV_REST_API_* when a custom prefix is chosen.
const envEnding = (suffix: string) =>
  Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v)?.[1];
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? envEnding("KV_REST_API_URL");
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? envEnding("KV_REST_API_TOKEN");

async function redis<T>(...cmd: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const body = (await res.json()) as { result?: T; error?: string };
  if (body.error) throw new Error(`Store error: ${body.error}`);
  return body.result as T;
}

const parse = (s: string | null) => {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const redisBackend: Backend = {
  getGuide: async (key) => parse(await redis<string | null>("GET", `guide:${key}`)),
  putGuide: async (key, guide) => {
    await redis("SET", `guide:${key}`, JSON.stringify(guide));
    await redis("SADD", "guides", key);
  },
  listGuides: async () => {
    const keys = await redis<string[]>("SMEMBERS", "guides");
    if (!keys.length) return [];
    const values = await redis<(string | null)[]>("MGET", ...keys.map((k) => `guide:${k}`));
    return values.map(parse).filter(Boolean);
  },
  lock: async (key) => (await redis<string | null>("SET", `lock:${key}`, Date.now(), "NX", "EX", LOCK_TTL_S)) === "OK",
  unlock: async (key) => {
    await redis("DEL", `lock:${key}`);
  },
  runs: async (id) => Number((await redis<string | null>("GET", `runs:${id}`)) ?? 0),
  addRuns: async (id, delta) => {
    const n = await redis<number>("INCRBY", `runs:${id}`, delta);
    if (n < 0) await redis("SET", `runs:${id}`, 0);
    if (id.startsWith("day-")) await redis("EXPIRE", `runs:${id}`, 2 * 24 * 3600);
  },
  getProgress: async (key) => parse(await redis<string | null>("GET", `progress:${key}`)),
  putProgress: async (p) => {
    await redis("SET", `progress:${p.key}`, JSON.stringify(p), "EX", LOCK_TTL_S);
    await redis("SADD", "running", p.key);
  },
  endProgress: async (key) => {
    await redis("DEL", `progress:${key}`);
    await redis("SREM", "running", key);
  },
  listProgress: async () => {
    const keys = await redis<string[]>("SMEMBERS", "running");
    if (!keys.length) return [];
    const values = await redis<(string | null)[]>("MGET", ...keys.map((k) => `progress:${k}`));
    const stale = keys.filter((_, i) => !values[i]);
    if (stale.length) await redis("SREM", "running", ...stale);
    return values.map(parse).filter(Boolean);
  },
};

const ROOT = process.env.GUIDE_STORE_DIR ?? (process.env.VERCEL ? "/tmp/oauth-guides" : path.join(process.cwd(), ".data"));
const file = (...p: string[]) => path.join(ROOT, ...p);

async function readJson(rel: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(file(rel), "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(rel: string, data: unknown) {
  await fs.mkdir(path.dirname(file(rel)), { recursive: true });
  const tmp = file(`${rel}.${process.pid}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file(rel));
}

const fileBackend: Backend = {
  getGuide: (key) => readJson(`guides/${key}.json`),
  putGuide: (key, guide) => writeJson(`guides/${key}.json`, guide),
  listGuides: async () => {
    try {
      const names = (await fs.readdir(file("guides"))).filter((f) => f.endsWith(".json"));
      return Promise.all(names.map((n) => readJson(`guides/${n}`)));
    } catch {
      return [];
    }
  },
  lock: async (key) => {
    await fs.mkdir(file("locks"), { recursive: true });
    try {
      await fs.writeFile(file(`locks/${key}.json`), JSON.stringify({ at: Date.now() }), { flag: "wx" });
      return true;
    } catch {
      const held = (await readJson(`locks/${key}.json`)) as { at?: number } | null;
      if (held?.at && Date.now() - held.at < LOCK_TTL_S * 1000) return false;
      await writeJson(`locks/${key}.json`, { at: Date.now() });
      return true;
    }
  },
  unlock: (key) => fs.rm(file(`locks/${key}.json`), { force: true }),
  runs: async (id) => ((await readJson(`visitors/${id}.json`)) as { runs?: number } | null)?.runs ?? 0,
  addRuns: async (id, delta) => {
    const now = await fileBackend.runs(id);
    await writeJson(`visitors/${id}.json`, { runs: Math.max(0, now + delta) });
  },
  getProgress: async (key) => {
    const p = (await readJson(`progress/${key}.json`)) as Progress | null;
    return p && Date.now() - p.startedAt < LOCK_TTL_S * 1000 ? p : null;
  },
  putProgress: (p) => writeJson(`progress/${p.key}.json`, p),
  endProgress: (key) => fs.rm(file(`progress/${key}.json`), { force: true }),
  listProgress: async () => {
    try {
      const names = (await fs.readdir(file("progress"))).filter((f) => f.endsWith(".json"));
      const all = await Promise.all(names.map((n) => fileBackend.getProgress(n.slice(0, -5))));
      return all.filter((p): p is Progress => !!p);
    } catch {
      return [];
    }
  },
};

const db: Backend = REDIS_URL && REDIS_TOKEN ? redisBackend : fileBackend;
export const STORE_KIND = db === redisBackend ? "redis" : "file";

const validKey = (k: string) => /^[a-z0-9-]{1,40}$/.test(k);

export async function getSaved(key: string): Promise<Guide | null> {
  if (!validKey(key)) return null;
  const parsed = Guide.safeParse(await db.getGuide(key));
  return parsed.success ? parsed.data : null;
}

export const saveGuide = (guide: Guide) => db.putGuide(guide.slug, guide);

export async function listSaved(): Promise<SavedSummary[]> {
  return (await db.listGuides())
    .map((raw) => Guide.safeParse(raw))
    .filter((p) => p.success)
    .map(({ data: g }) => ({ slug: g!.slug, name: g!.name, researchedOn: g!.researchedOn, difficulty: g!.verdict.difficulty }))
    .sort((a, b) => b.researchedOn.localeCompare(a.researchedOn) || a.name.localeCompare(b.name));
}

export const acquireLock = (key: string) => db.lock(key);
export const releaseLock = (key: string) => db.unlock(key);

export const getProgress = (key: string) => (validKey(key) ? db.getProgress(key) : Promise.resolve(null));
export const putProgress = (p: Progress) => db.putProgress(p);
export const endProgress = (key: string) => db.endProgress(key);
export async function listProgress(): Promise<Progress[]> {
  return (await db.listProgress()).sort((a, b) => b.startedAt - a.startedAt);
}

// A browser is counted by its cookie and by a fingerprint of the browser
// itself, so clearing cookies or cache doesn't reset its run. Both are stored
// only as salted hashes, and a run counts against both.
export const RUN_LIMIT = Number(process.env.LIVE_RUNS_PER_VISITOR ?? 1);
// The hard guard on API quota: new research runs per UTC day, across everyone.
export const DAILY_LIMIT = Number(process.env.LIVE_RUNS_PER_DAY ?? 15);
const SALT = process.env.VISITOR_SALT ?? "oauth-approval-paths";
const hash = (s: string) => crypto.createHash("sha256").update(SALT + s).digest("hex").slice(0, 32);
const dayId = () => `day-${new Date().toISOString().slice(0, 10)}`;

export type Visitor = { ids: string[] };

export function visitorFrom(cookieId: string, fingerprint?: string | null): Visitor {
  const ids = [`c-${hash(cookieId)}`];
  if (fingerprint && /^[a-f0-9]{64}$/.test(fingerprint)) ids.push(`f-${hash(fingerprint)}`);
  return { ids };
}

export async function runsLeft(v: Visitor): Promise<number> {
  if (RUN_LIMIT <= 0) return Infinity;
  const used = Math.max(...(await Promise.all(v.ids.map((id) => db.runs(id)))));
  return Math.max(0, RUN_LIMIT - used);
}

export async function dailyLeft(): Promise<number> {
  if (DAILY_LIMIT <= 0) return Infinity;
  return Math.max(0, DAILY_LIMIT - (await db.runs(dayId())));
}

export async function recordRun(v: Visitor, delta: 1 | -1) {
  await Promise.all([...v.ids, dayId()].map((id) => db.addRuns(id, delta)));
}
