import Link from "next/link";
import type { Guide, Path } from "@/lib/schema";
import { fastestAndLongest, formatHours, pathSpan } from "@/lib/time";

type Entry = { slug: string; name: string; time: string; note?: string };

const short = (g: Guide) => g.name.split(" (")[0];
const hasPhase = (p: Path, kind: Path["timeline"][number]["kind"]) => p.timeline.some((ph) => ph.kind === kind);
function timeOf(p: Path) {
  const s = pathSpan(p);
  return s.openEnded ? `${formatHours(s.max)} or more` : `about ${formatHours(s.max)}`;
}

function Tile({
  question,
  answer,
  entries,
  className,
  empty,
  inline = false,
}: {
  question: string;
  answer: string;
  entries: Entry[];
  className: string;
  empty: string;
  inline?: boolean;
}) {
  return (
    <div className={`p-5 ${className}`}>
      <h3 className="font-semibold">{question}</h3>
      <p className="mt-1 text-sm opacity-80">{answer}</p>
      {entries.length && inline ? (
        <p className="mt-4 text-sm leading-relaxed">
          {entries.map((e, i) => (
            <span key={e.slug}>
              {i > 0 && ", "}
              <Link href={`/guides/${e.slug}`} className="font-medium underline decoration-current/30 underline-offset-2 hover:decoration-current">
                {e.name}
              </Link>
            </span>
          ))}
        </p>
      ) : entries.length ? (
        <ul className="mt-4 space-y-1.5 text-sm">
          {entries.map((e) => (
            <li key={e.slug} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <Link href={`/guides/${e.slug}`} className="font-medium underline decoration-current/30 underline-offset-2 hover:decoration-current">
                {e.name}
              </Link>
              <span className="tabular-nums opacity-80">
                {e.time}
                {e.note ? `, ${e.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm opacity-80">{empty}</p>
      )}
    </div>
  );
}

// Four plain questions a developer asks before choosing a provider, each
// answered from the guides. Tile colour = the party the question is about.
export function AtAGlance({ guides }: { guides: Guide[] }) {
  const rows = guides.map((g) => ({ g, ...fastestAndLongest(g.paths) }));
  const byTime = (a: { span: { max: number } }, b: { span: { max: number } }) => a.span.max - b.span.max;

  const noReview = rows
    .map((r) => ({ r, p: r.g.paths.filter((p) => !hasPhase(p, "provider_review")).map((p) => ({ path: p, span: pathSpan(p) })).sort(byTime)[0] }))
    .filter((x) => x.p)
    .sort((a, b) => byTime(a.p, b.p))
    .map(({ r, p }) => ({ slug: r.g.slug, name: short(r.g), time: timeOf(p.path), note: r.g.paths.length > 1 ? p.path.name : undefined }));

  const reviewed = rows
    .filter((r) => r.g.paths.every((p) => hasPhase(p, "provider_review")))
    .sort((a, b) => byTime(a.fastest, b.fastest))
    .map((r) => ({ slug: r.g.slug, name: short(r.g), time: timeOf(r.fastest.path) }));

  const adminGate = rows
    .filter((r) => r.g.paths.some((p) => hasPhase(p, "customer_admin_approval")))
    .map((r) => ({ slug: r.g.slug, name: short(r.g), time: "" }));

  const months = rows
    .filter((r) => r.longest.span.max >= 24 * 30)
    .sort((a, b) => b.longest.span.max - a.longest.span.max)
    .map((r) => ({ slug: r.g.slug, name: short(r.g), time: timeOf(r.longest.path), note: r.longest.path.name }));

  return (
    <section aria-labelledby="glance" className="mt-2">
      <h2 id="glance" className="text-lg font-semibold tracking-tight">Before you pick a provider</h2>
      <p className="mt-1 max-w-[70ch] text-sm text-muted">
        The same {guides.length} providers, grouped by what you&rsquo;ll face. Times are for that provider&rsquo;s quickest route unless
        noted.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Tile
          question="Which can I ship without a review?"
          answer="The provider doesn't review your app on at least one route. You can go live once it's built."
          entries={noReview}
          className="rounded-[22px] bg-you-soft text-on-soft"
          empty="None of the guides found a route without review."
        />
        <Tile
          question="Which review my app first?"
          answer="Every route goes through the provider's own review before real users can connect."
          entries={reviewed}
          className="rounded-2xl bg-provider-soft text-on-soft"
          empty="None. Every provider has at least one route without a review."
        />
        <Tile
          question="Where must each customer's admin approve it?"
          answer="Even after you're live, an org or workspace admin at each customer may have to allow your app. Nobody publishes how long that takes."
          entries={adminGate}
          inline
          className="rounded-2xl bg-customer-soft text-on-soft"
          empty="None found."
        />
        <Tile
          question="Which can take a month or more?"
          answer="On their slowest route, usually a marketplace listing or a security review."
          entries={months}
          className="rounded-xl border border-line bg-surface"
          empty="None."
        />
      </div>
    </section>
  );
}
