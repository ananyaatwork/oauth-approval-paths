export type SearchResult = { title: string; url: string; snippet: string };
export type SearchOutcome = { provider: string; results: SearchResult[] };

type Provider = { name: string; enabled: () => boolean; run: (q: string) => Promise<SearchResult[]> };

const TIMEOUT_MS = 15_000;

async function json(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 200) };
  }
}

const tavily: Provider = {
  name: "Tavily",
  enabled: () => !!process.env.TAVILY_API_KEY,
  async run(q) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, max_results: 8, search_depth: "basic", topic: "general" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await json(res);
    if (!res.ok) throw new Error(`Tavily ${res.status}: ${body?.detail?.error ?? JSON.stringify(body).slice(0, 120)}`);
    return (body.results ?? []).map((r: { title?: string; url: string; content?: string }) => ({
      title: r.title ?? r.url,
      url: r.url,
      snippet: r.content ?? "",
    }));
  },
};

const serper: Provider = {
  name: "Serper",
  enabled: () => !!process.env.SERPER_API_KEY,
  async run(q) {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num: 8 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await json(res);
    if (!res.ok) throw new Error(`Serper ${res.status}: ${body?.message ?? JSON.stringify(body).slice(0, 120)}`);
    return (body.organic ?? []).map((r: { title?: string; link: string; snippet?: string }) => ({
      title: r.title ?? r.link,
      url: r.link,
      snippet: r.snippet ?? "",
    }));
  },
};

const PROVIDERS = [tavily, serper];

export const searchConfigured = () => PROVIDERS.some((p) => p.enabled());

// Tries each configured provider in order; a provider that errors (quota,
// outage) is skipped for the rest of this run.
export function makeSearcher(onFallback: (from: string, reason: string, hasBackup: boolean) => void) {
  const dead = new Set<string>();
  return async function search(q: string): Promise<SearchOutcome> {
    let lastError = "no search provider is configured";
    for (const p of PROVIDERS) {
      if (!p.enabled() || dead.has(p.name)) continue;
      try {
        return { provider: p.name, results: await p.run(q) };
      } catch (err) {
        dead.add(p.name);
        lastError = (err as Error).message;
        onFallback(p.name, lastError, PROVIDERS.some((o) => o.enabled() && !dead.has(o.name)));
      }
    }
    throw new Error(`Search failed: ${lastError}`);
  };
}
