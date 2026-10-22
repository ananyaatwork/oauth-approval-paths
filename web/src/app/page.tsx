import Link from "next/link";
import { library } from "@/guides";
import { LibraryChart } from "@/components/LibraryChart";
import { ResearchForm } from "@/components/ResearchForm";
import { listSaved } from "@/lib/store";
import { fastestAndLongest, pathSpan } from "@/lib/time";

export const revalidate = 60;

const MONTH_H = 24 * 30;

function takeaway() {
  const spans = library.map((g) => fastestAndLongest(g.paths));
  const overMonth = spans.filter((s) => s.longest.span.max >= MONTH_H).length;
  const unpublished = library.filter((g) => g.paths.some((p) => pathSpan(p).openEnded)).length;
  const sameDay = spans.filter((s) => s.fastest.span.max < 24).length;
  return { overMonth, unpublished, sameDay, total: library.length };
}

export default async function Home() {
  const saved = (await listSaved()).slice(0, 4);
  const t = takeaway();
  return (
    <>
      <section className="pt-12 pb-8">
        <h1 className="max-w-[22ch] text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[44px]">
          How long until your users can connect their accounts?
        </h1>
        <p className="mt-4 max-w-[64ch] text-lg text-muted">
          Before your agent can use a provider&rsquo;s API, you register an OAuth app and often get it approved. Each guide shows the
          wait, who you wait on, and what&rsquo;s confirmed.
        </p>
        <div className="mt-6 max-w-xl">
          <ResearchForm known={library.map(({ slug, name }) => ({ slug, name }))} />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Try:</span>
            {[
              ...["slack", "google", "salesforce"].map((slug) => ({ href: `/guides/${slug}`, name: library.find((g) => g.slug === slug)?.name.split(" (")[0] ?? slug })),
              ...saved.map((s) => ({ href: `/g/${s.slug}`, name: s.name })),
            ].map((t) => (
              <Link key={t.href} href={t.href} className="rounded-full border border-line bg-surface px-3 py-1 hover:border-ink">
                {t.name}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            Not in the library? Type its name or website and an agent reads the provider&rsquo;s docs live, in about a minute,
            then saves the guide for everyone.
          </p>
        </div>
      </section>

      <section aria-labelledby="lib">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-2">
          <h2 id="lib" className="text-lg font-semibold tracking-tight">Library, sorted by time to production</h2>
          <p className="text-sm">
            {t.sameDay} of {t.total} can work the same day. {t.overMonth} of {t.total} have a path that takes over a month, and{" "}
            {t.unpublished === t.total ? `all ${t.total}` : `${t.unpublished} of ${t.total}`} include a wait with no published time.
          </p>
        </div>
        <div className="mt-5">
          <LibraryChart guides={library} />
        </div>
      </section>

      <section className="mt-16 grid gap-8 text-sm md:grid-cols-3" aria-label="What these guides cover">
        <div>
          <h2 className="font-semibold">Your OAuth app</h2>
          <p className="mt-1 text-muted">
            Registered once by you with the provider. It holds your client ID, redirect URLs and scopes. Reviews and user caps apply
            here.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Your integration</h2>
          <p className="mt-1 text-muted">
            Your code that runs the OAuth flow using that app. These guides cover what the provider requires, not how to write it.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Each user&rsquo;s connection</h2>
          <p className="mt-1 text-muted">
            One consent and token per end user. Some providers also need each customer&rsquo;s admin to approve your app, which can be
            the longest wait.
          </p>
        </div>
      </section>
    </>
  );
}
