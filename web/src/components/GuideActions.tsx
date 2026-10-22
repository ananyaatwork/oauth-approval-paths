"use client";

import { useEffect, useRef, useState } from "react";
import type { Guide } from "@/lib/schema";
import { guideMarkdown } from "@/lib/share";

export function GuideActions({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copy(kind: "link" | "markdown") {
    const link = `${location.origin}/${guide.origin === "library" ? "guides" : "g"}/${guide.slug}`;
    try {
      await navigator.clipboard.writeText(kind === "link" ? link : guideMarkdown(guide));
      setStatus(kind === "link" ? "Link copied" : "Markdown copied");
    } catch {
      setStatus("Couldn't copy. Copy the address bar instead");
    }
    setOpen(false);
    setTimeout(() => setStatus(null), 2500);
  }

  function download() {
    const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${guide.slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setOpen(false);
  }

  const item = "block w-full px-3 py-2 text-left text-sm hover:bg-paper focus-visible:bg-paper";
  return (
    <div ref={root} className="relative flex items-center gap-3 print:hidden">
      <span role="status" className="text-sm text-muted">{status}</span>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-line bg-surface px-3.5 py-1.5 text-sm font-medium hover:border-ink"
      >
        Share
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-sm">
          <button role="menuitem" className={item} onClick={() => copy("link")}>Copy link</button>
          <button role="menuitem" className={item} onClick={() => copy("markdown")}>Copy as Markdown</button>
          <button role="menuitem" className={item} onClick={download}>Download JSON</button>
        </div>
      )}
    </div>
  );
}
