"use client";

import { useState } from "react";
import type { Guide } from "@/lib/schema";
import { guideMarkdown } from "@/lib/share";

export function GuideActions({ guide }: { guide: Guide }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(kind: "link" | "markdown") {
    const link = `${location.origin}/${guide.origin === "library" ? "guides" : "g"}/${guide.slug}`;
    try {
      await navigator.clipboard.writeText(kind === "link" ? link : guideMarkdown(guide));
      setCopied(kind === "link" ? "Link copied" : "Markdown copied");
    } catch {
      setCopied("Couldn't copy. Copy the address bar instead");
    }
    setTimeout(() => setCopied(null), 2500);
  }

  function download() {
    const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${guide.slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const btn = "rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:border-ink";
  return (
    <div className="flex flex-wrap items-center gap-2 pt-6 print:hidden">
      <button className={btn} onClick={() => copy("link")}>Copy link</button>
      <button className={btn} onClick={() => copy("markdown")}>Copy as Markdown</button>
      <button className={btn} onClick={download}>Download JSON</button>
      <span role="status" className="text-sm text-muted">{copied}</span>
    </div>
  );
}
