import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";

export type Page = { url: string; title: string; blocks: string[]; via: "direct" | "jina" };

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_500_000;
const MIN_TEXT = 600;

// Search results can point anywhere; never fetch internal addresses.
export function isFetchable(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    if (h.startsWith("[") || h === "::1") return false;
    return true;
  } catch {
    return false;
  }
}

function blocksFromHtml(html: string, url: string): { title: string; blocks: string[] } {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, { url, virtualConsole });
  const doc = dom.window.document;
  const article = new Readability(doc).parse();
  const title = article?.title || doc.title || url;
  const container = article?.content ? new JSDOM(article.content, { virtualConsole }).window.document.body : doc.body;
  const blocks: string[] = [];
  for (const el of Array.from(container?.querySelectorAll("h1,h2,h3,h4,p,li,td,pre,dt,dd,blockquote") ?? [])) {
    if (el.querySelector("p,li,table")) continue;
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text.length < 3) continue;
    blocks.push(/^H[1-4]$/.test(el.tagName) ? `## ${text}` : text);
  }
  return { title: title.trim(), blocks };
}

async function readDirect(url: string): Promise<Page | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; OAuthApprovalPaths/1.0; research bot for developer docs)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
  const html = (await res.text()).slice(0, MAX_BYTES);
  const { title, blocks } = blocksFromHtml(html, res.url || url);
  if (blocks.join(" ").length < MIN_TEXT) return null;
  return { url: res.url || url, title, blocks, via: "direct" };
}

// Jina Reader renders JavaScript-only pages; free without a key at a low rate.
async function readJina(url: string): Promise<Page | null> {
  const headers: Record<string, string> = { Accept: "text/plain" };
  if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  const res = await fetch(`https://r.jina.ai/${url}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS * 2) });
  if (!res.ok) return null;
  const text = (await res.text()).slice(0, MAX_BYTES);
  const title = text.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? url;
  const body = text.split(/^Markdown Content:\s*$/m)[1] ?? text;
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim())
    .map((b) => (b.startsWith("#") ? `## ${b.replace(/^#+\s*/, "")}` : b))
    .filter((b) => b.length >= 3);
  if (blocks.join(" ").length < MIN_TEXT) return null;
  return { url, title, blocks, via: "jina" };
}

export async function readPage(url: string): Promise<Page | { error: string }> {
  if (!isFetchable(url)) return { error: "blocked address" };
  try {
    const direct = await readDirect(url);
    if (direct) return direct;
  } catch {}
  try {
    const viaJina = await readJina(url);
    if (viaJina) return viaJina;
  } catch {}
  return { error: "no readable text" };
}

const KEYWORDS = [
  "review", "approv", "verif", "publish", "marketplace", "listing", "directory", "app store", "scope", "permission",
  "oauth", "redirect", "callback", "client id", "client secret", "consent", "admin", "business day", "days", "weeks",
  "limit", "rate", "quota", "token", "expire", "refresh", "sandbox", "production", "test user", "partner", "security",
  "assessment", "privacy policy", "terms", "submit", "submission", "distribution", "install", "workspace", "tenant",
  "requirement", "eligib", "unverified", "certif", "fee", "support",
];

// Keeps the paragraphs that talk about registration, review, limits and time,
// with the heading above each, so the model reads a fraction of the page.
export function relevantText(page: Page, maxWords = 1200): string {
  const out: string[] = [];
  let heading = "";
  let words = 0;
  let lastHeadingUsed = "";
  for (const b of page.blocks) {
    if (b.startsWith("## ")) {
      heading = b;
      continue;
    }
    const lower = b.toLowerCase();
    const score = KEYWORDS.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0) + (/\d/.test(b) ? 1 : 0);
    if (score < 2) continue;
    if (heading && heading !== lastHeadingUsed) {
      out.push(heading);
      lastHeadingUsed = heading;
    }
    out.push(b);
    words += b.split(" ").length;
    if (words >= maxWords) break;
  }
  return out.join("\n");
}
