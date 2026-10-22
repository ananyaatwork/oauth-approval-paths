"use client";

import { useEffect, useState } from "react";

export type ChecklistItem = { id: string; label: React.ReactNode; detail?: string | null };

// Ticks are a per-viewer convenience, so they live in localStorage and the
// list still works if storage is unavailable.
export function Checklist({ storageKey, items }: { storageKey: string; items: ChecklistItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(storageKey) ?? "{}"));
    } catch {}
  }, [storageKey]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const count = items.filter((i) => done[i.id]).length;
  return (
    <div>
      <p className="mb-3 text-sm text-muted tabular-nums" aria-live="polite">
        {count} of {items.length} ready
      </p>
      <ul className="grid gap-x-8 gap-y-2.5 text-sm md:grid-cols-2">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer gap-2.5">
              <input
                type="checkbox"
                checked={!!done[i.id]}
                onChange={() => toggle(i.id)}
                className="check"
              />
              <span className={done[i.id] ? "text-muted line-through decoration-muted/60" : ""}>
                {i.label}
                {i.detail && <span className="block text-muted no-underline">{i.detail}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
