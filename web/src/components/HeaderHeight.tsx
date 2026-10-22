"use client";

import { useEffect } from "react";

// Publishes the sticky site header's height as --header-h, so things that
// stick below it (the guide's section links on phones) sit flush under it
// even when the header wraps onto two lines.
export function HeaderHeight() {
  useEffect(() => {
    const el = document.getElementById("site-header");
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const obs = new ResizeObserver(set);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return null;
}
