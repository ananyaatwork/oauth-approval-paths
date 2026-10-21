"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
export type KnownApp = { slug: string; name: string };

export function ResearchForm({
  known,
  initial = "",
  onSubmit,
}: {
  known: KnownApp[];
  initial?: string;
  onSubmit?: (app: string) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const app = value.trim();
    if (!app) return;
    const key = app.toLowerCase().replace(/^https?:\/\/(www\.)?/, "");
    const hit = known.find((g) => key === g.slug || key.startsWith(g.slug + ".") || g.name.toLowerCase() === key);
    if (hit && !onSubmit) return router.push(`/guides/${hit.slug}`);
    if (onSubmit) onSubmit(app);
    else router.push(`/generate?app=${encodeURIComponent(app)}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 max-sm:flex-col">
      <label htmlFor="app" className="sr-only">App name or website</label>
      <input
        id="app"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="App name or website, e.g. Linear or dropbox.com"
        className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2.5 placeholder:text-muted"
        autoComplete="off"
      />
      <button type="submit" className="rounded-md bg-ink px-4 py-2.5 font-medium text-paper hover:opacity-90">
        Get the guide
      </button>
    </form>
  );
}
