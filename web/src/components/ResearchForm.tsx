"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
export type KnownApp = { slug: string; name: string };

export function ResearchForm({
  known,
  initial = "",
  onSubmit,
  size = "md",
}: {
  known: KnownApp[];
  initial?: string;
  onSubmit?: (app: string) => void;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
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
    <form onSubmit={submit} className={`search-pill ${lg ? "search-pill-lg" : ""}`}>
      <label htmlFor="app" className="sr-only">App name or website</label>
      <svg aria-hidden viewBox="0 0 24 24" className={`shrink-0 text-muted ${lg ? "ml-3 h-6 w-6" : "ml-2.5 h-5 w-5"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="app"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        name="app"
        placeholder="Search any app: Linear, dropbox.com…"
        className={`min-w-0 flex-1 px-1 placeholder:text-muted ${lg ? "py-3.5 text-lg" : "py-2.5 text-[15px]"}`}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
      />
      <button type="submit" className={`btn-primary shrink-0 ${lg ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm"}`}>
        Get the guide
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
