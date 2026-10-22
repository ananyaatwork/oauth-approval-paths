import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Guide } from "./schema";

// File-backed store for live guides and per-visitor run counts. On Vercel the
// filesystem only persists in /tmp per instance, so deployment swaps this for
// a durable store behind the same functions.
const ROOT = process.env.GUIDE_STORE_DIR ?? (process.env.VERCEL ? "/tmp/oauth-guides" : path.join(process.cwd(), ".data"));
const LOCK_TTL_MS = 6 * 60 * 1000;

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

export async function getSaved(key: string): Promise<Guide | null> {
  if (!/^[a-z0-9-]{1,40}$/.test(key)) return null;
  const parsed = Guide.safeParse(await readJson(`guides/${key}.json`));
  return parsed.success ? parsed.data : null;
}

export async function saveGuide(guide: Guide) {
  await writeJson(`guides/${guide.slug}.json`, guide);
}

export async function listSaved(): Promise<{ slug: string; name: string; researchedOn: string; difficulty: number }[]> {
  let names: string[] = [];
  try {
    names = (await fs.readdir(file("guides"))).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const out = [];
  for (const n of names) {
    const g = await getSaved(n.replace(/\.json$/, ""));
    if (g) out.push({ slug: g.slug, name: g.name, researchedOn: g.researchedOn, difficulty: g.verdict.difficulty });
  }
  return out.sort((a, b) => b.researchedOn.localeCompare(a.researchedOn) || a.name.localeCompare(b.name));
}

export async function acquireLock(key: string): Promise<boolean> {
  const rel = `locks/${key}.json`;
  await fs.mkdir(file("locks"), { recursive: true });
  try {
    await fs.writeFile(file(rel), JSON.stringify({ at: Date.now() }), { flag: "wx" });
    return true;
  } catch {
    const lock = (await readJson(rel)) as { at?: number } | null;
    if (lock?.at && Date.now() - lock.at < LOCK_TTL_MS) return false;
    await writeJson(rel, { at: Date.now() });
    return true;
  }
}

export async function releaseLock(key: string) {
  await fs.rm(file(`locks/${key}.json`), { force: true });
}

// Visitors are counted by cookie and by a salted hash of their IP, so clearing
// cookies alone doesn't reset the limit. Raw IPs are never stored.
export const RUN_LIMIT = Number(process.env.LIVE_RUNS_PER_VISITOR ?? 1);
const SALT = process.env.VISITOR_SALT ?? "oauth-approval-paths";
const hash = (s: string) => crypto.createHash("sha256").update(SALT + s).digest("hex").slice(0, 32);

export type Visitor = { ids: string[] };

export function visitorFrom(cookieId: string, ip: string): Visitor {
  return { ids: [`c-${hash(cookieId)}`, `ip-${hash(ip)}`] };
}

type VisitorRecord = { runs: number; apps: string[] };

async function readVisitor(id: string): Promise<VisitorRecord> {
  return ((await readJson(`visitors/${id}.json`)) as VisitorRecord | null) ?? { runs: 0, apps: [] };
}

export async function runsLeft(v: Visitor): Promise<number> {
  if (RUN_LIMIT <= 0) return Infinity;
  const used = Math.max(...(await Promise.all(v.ids.map(readVisitor))).map((r) => r.runs));
  return Math.max(0, RUN_LIMIT - used);
}

export async function recordRun(v: Visitor, key: string, delta: 1 | -1) {
  for (const id of v.ids) {
    const r = await readVisitor(id);
    r.runs = Math.max(0, r.runs + delta);
    r.apps = delta > 0 ? [...r.apps, key] : r.apps.filter((a, i) => !(a === key && i === r.apps.lastIndexOf(key)));
    await writeJson(`visitors/${id}.json`, r);
  }
}
