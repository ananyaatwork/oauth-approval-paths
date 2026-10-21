"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Guide } from "@/lib/schema";
import { decodeGuide } from "@/lib/share";
import { GuideView } from "@/components/GuideView";
import { GuideActions } from "@/components/GuideActions";

export default function SharedGuide() {
  const [state, setState] = useState<{ guide: Guide | null; ready: boolean }>({ guide: null, ready: false });

  useEffect(() => {
    const read = () => setState({ guide: decodeGuide(location.hash), ready: true });
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (!state.ready) return null;
  if (!state.guide)
    return (
      <div className="pt-14">
        <h1 className="text-2xl font-semibold">This share link is incomplete</h1>
        <p className="mt-2 text-muted">
          The guide is stored in the part of the link after #, and it seems to be missing or cut off. Ask for the link
          again, or <Link href="/generate" className="underline">research the app yourself</Link>.
        </p>
      </div>
    );
  return (
    <>
      <GuideActions guide={state.guide} />
      <GuideView guide={state.guide} />
    </>
  );
}
