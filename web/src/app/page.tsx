import Link from "next/link";
import { library } from "@/guides";
import { LibraryChart } from "@/components/LibraryChart";
import { ResearchForm } from "@/components/ResearchForm";
import { listSaved } from "@/lib/store";
import { AtAGlance } from "@/components/AtAGlance";

export const revalidate = 60;

export default async function Home() {
  const saved = (await listSaved()).slice(0, 4);
  return (
    <>
      {/* Fills the first screen (minus the header) so the search is the one thing to do on arrival. */}
      <section className="flex min-h-[calc(100svh-3.25rem)] flex-col justify-center py-12">
        <h1 className="max-w-[17ch] text-[40px] font-semibold leading-[1.03] tracking-tight sm:text-[60px] lg:text-[72px]">
          How long until your users can connect their accounts?
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg text-muted sm:text-xl">
          Before your agent can use a provider&rsquo;s API, you register an OAuth app and often get it approved. Each guide shows the
          wait, who you wait on, and what&rsquo;s confirmed.
        </p>
        <div className="mt-10 max-w-2xl">
          <ResearchForm size="lg" known={library.map(({ slug, name }) => ({ slug, name }))} />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[15px]">
            <span className="text-muted">Try:</span>
            {[
              ...["slack", "google", "salesforce"].map((slug) => ({ href: `/guides/${slug}`, name: library.find((g) => g.slug === slug)?.name.split(" (")[0] ?? slug })),
              ...saved.map((s) => ({ href: `/g/${s.slug}`, name: s.name })),
            ].map((t) => (
              <Link key={t.href} href={t.href} className="btn-ghost rounded-full px-3.5 py-1.5">
                {t.name}
              </Link>
            ))}
          </div>
          <p className="mt-4 max-w-[60ch] text-[15px] text-muted">
            Not in the library? Type its name or website and an agent reads the provider&rsquo;s docs live, in about a minute,
            then saves the guide for everyone.
          </p>
        </div>
        <a href="#glance" className="mt-14 w-fit text-[15px] font-medium underline decoration-current/30 underline-offset-4 hover:decoration-current">
          Compare all {library.length} providers
        </a>
      </section>

      <AtAGlance guides={library} />

      <section aria-labelledby="lib" className="mt-14">
        <h2 id="lib" className="text-lg font-semibold tracking-tight">Library, sorted by time to production</h2>
        <div className="card mt-5 p-4 sm:p-6">
          <LibraryChart guides={library} />
        </div>
      </section>

      <section className="mt-14 grid gap-8 text-sm md:grid-cols-3" aria-label="What these guides cover">
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
