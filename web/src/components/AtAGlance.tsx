import Link from "next/link";
import type { Guide } from "@/lib/schema";
import { PHASE_OWNER, fastestAndLongest, formatHours, pathSpan, phaseHours } from "@/lib/time";

type Owner = "you" | "provider" | "customer_admin";
const OWNER_LABEL: Record<Owner, string> = { you: "Your own work", provider: "Provider review", customer_admin: "Customer's admin" };
const OWNER_BAR: Record<Owner, string> = { you: "bg-you", provider: "bg-provider", customer_admin: "bg-customer" };

// Bento summary of the library. Every number is computed from the guides, and
// each tile's colour is the colour of the party it is about.
export function AtAGlance({ guides }: { guides: Guide[] }) {
  const spans = guides.map((g) => ({ g, ...fastestAndLongest(g.paths) }));
  const sameDay = spans.filter((s) => s.fastest.span.max < 24);
  const overMonth = spans.filter((s) => s.longest.span.max >= 24 * 30);
  const unpublished = guides.filter((g) => g.paths.some((p) => pathSpan(p).openEnded));
  const adminGate = guides.filter((g) => g.paths.some((p) => p.timeline.some((ph) => ph.kind === "customer_admin_approval")));
  const quickest = [...spans].sort((a, b) => a.fastest.span.max - b.fastest.span.max)[0];
  const slowest = [...spans].sort((a, b) => b.longest.span.max - a.longest.span.max)[0];

  // Whose phase is the single longest known wait on each provider's longest route.
  const longestOwner: Record<Owner, number> = { you: 0, provider: 0, customer_admin: 0 };
  for (const s of spans) {
    const known = s.longest.path.timeline.filter((p) => phaseHours(p) != null);
    const top = known.sort((a, b) => (phaseHours(b) ?? 0) - (phaseHours(a) ?? 0))[0];
    if (top) longestOwner[PHASE_OWNER[top.kind]]++;
  }
  const maxOwner = Math.max(...Object.values(longestOwner), 1);
  const n = guides.length;
  const names = (list: { g: Guide }[] | Guide[]) =>
    list.map((x) => ("g" in x ? x.g : x).name.split(" (")[0]).join(", ");

  return (
    <section aria-labelledby="glance" className="mt-2">
      <h2 id="glance" className="text-lg font-semibold tracking-tight">At a glance</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-[22px] bg-you-soft p-5 text-on-soft sm:col-span-2">
          <p className="text-sm font-medium">Can work the same day</p>
          <p className="mt-6 text-6xl font-semibold leading-none tracking-tight tabular-nums">
            {sameDay.length}<span className="text-2xl font-medium"> of {n}</span>
          </p>
          <p className="mt-3 text-sm">{names(sameDay)}</p>
        </div>

        <div className="rounded-2xl bg-provider-soft p-5 text-on-soft">
          <p className="text-sm font-medium">Have a route over a month</p>
          <p className="mt-6 text-5xl font-semibold leading-none tracking-tight tabular-nums">
            {overMonth.length}<span className="text-xl font-medium"> of {n}</span>
          </p>
          <p className="mt-3 text-[13px]">Mostly marketplace and security reviews</p>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-5">
          <p className="text-sm font-medium">Include a wait with no published time</p>
          <p className="mt-6 text-5xl font-semibold leading-none tracking-tight tabular-nums">
            {unpublished.length}<span className="text-xl font-medium text-muted"> of {n}</span>
          </p>
          <div aria-hidden className="hatch mt-4 h-2 rounded-full" />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:col-span-2">
          <p className="text-sm font-medium">Whose step is the longest known wait</p>
          <ul className="mt-4 space-y-3">
            {(Object.keys(longestOwner) as Owner[]).map((o) => (
              <li key={o} className="grid grid-cols-[8.5rem_minmax(0,1fr)_1.5rem] items-center gap-3 text-sm">
                <span>{OWNER_LABEL[o]}</span>
                <span className="h-3 rounded-full bg-surface-2">
                  <span className={`block h-3 rounded-full ${OWNER_BAR[o]}`} style={{ width: `${(longestOwner[o] / maxOwner) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">{longestOwner[o]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">Counted on each provider&rsquo;s longest route, among waits with a known length.</p>
        </div>

        <div className="rounded-2xl bg-customer-soft p-5 text-on-soft">
          <p className="text-sm font-medium">Need each customer&rsquo;s admin</p>
          <p className="mt-6 text-5xl font-semibold leading-none tracking-tight tabular-nums">
            {adminGate.length}<span className="text-xl font-medium"> of {n}</span>
          </p>
          <p className="mt-3 text-[13px]">An org or tenant admin approves your app, per customer</p>
        </div>

        <div className="grid gap-3">
        <Link href={`/guides/${quickest.g.slug}`} className="rounded-xl bg-ink p-5 text-paper transition-opacity hover:opacity-90">
          <p className="text-sm font-medium opacity-80">Quickest</p>
          <p className="mt-2 text-2xl font-semibold leading-tight">{quickest.g.name.split(" (")[0]}</p>
          <p className="mt-1 text-sm tabular-nums">
            {formatHours(quickest.fastest.span.max)}
            {quickest.fastest.span.openEnded ? "+" : ""} · open the guide →
          </p>
        </Link>
        <Link href={`/guides/${slowest.g.slug}`} className="rounded-xl border border-line bg-surface p-5 transition-colors hover:bg-surface-2">
          <p className="text-sm font-medium text-muted">Slowest</p>
          <p className="mt-2 text-2xl font-semibold leading-tight">{slowest.g.name.split(" (")[0]}</p>
          <p className="mt-1 text-sm tabular-nums">
            {formatHours(slowest.longest.span.max)}
            {slowest.longest.span.openEnded ? "+" : ""} · {slowest.longest.path.name}
          </p>
        </Link>
        </div>
      </div>
    </section>
  );
}
