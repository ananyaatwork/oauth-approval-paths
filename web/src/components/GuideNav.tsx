"use client";

import { useEffect, useState } from "react";

export type NavItem = { id: string; label: string };

export function GuideNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = items.find((i) => seen.get(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [items]);

  return (
    <>
      <nav aria-label="On this page" className="sticky top-6 hidden self-start lg:block">
        <p className="mb-2 text-[13px] font-medium text-ink">On this page</p>
        <ul className="space-y-0.5 border-l border-line text-sm">
          {items.map((i) => (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                aria-current={active === i.id ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1 pl-3 ${active === i.id ? "border-[var(--focus)] text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label="On this page"
        className="sticky top-0 z-10 -mx-4 mt-8 flex gap-1.5 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur lg:hidden"
      >
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            aria-current={active === i.id ? "location" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-[13px] ${active === i.id ? "border-ink text-ink" : "border-line text-muted"}`}
          >
            {i.label}
          </a>
        ))}
      </nav>
    </>
  );
}
