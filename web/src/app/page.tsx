import { library } from "@/guides";
import { LibraryChart } from "@/components/LibraryChart";
import { ResearchForm } from "@/components/ResearchForm";

export default function Home() {
  return (
    <>
      <section className="pt-14 pb-10">
        <h1 className="max-w-[20ch] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          How long until your users can connect their accounts?
        </h1>
        <p className="mt-5 max-w-[62ch] text-lg text-muted">
          Before your agent can act on a user&rsquo;s Slack, Google or QuickBooks, you register an OAuth app with that
          provider, and many providers review it before the public can use it. Each guide shows what works today,
          what you submit, who you wait on and for how long, and which of its claims we could confirm.
        </p>
        <div className="mt-8 max-w-xl">
          <ResearchForm known={library.map(({ slug, name }) => ({ slug, name }))} />
          <p className="mt-2 text-sm text-muted">
            Not in the library? An agent researches the provider&rsquo;s docs live, usually in 1&ndash;3 minutes.
          </p>
        </div>
      </section>

      <section aria-labelledby="lib">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lib" className="text-lg font-semibold tracking-tight">
            Library, sorted by time to production
          </h2>
          <p className="text-sm text-muted">Each bar runs from the fastest path&rsquo;s earliest finish to the slowest path&rsquo;s known end. Hatched: a wait with no stated SLA.</p>
        </div>
        <div className="mt-4">
          <LibraryChart guides={library} />
        </div>
      </section>

      <section className="mt-14 grid gap-8 text-sm md:grid-cols-3">
        <div>
          <h2 className="font-semibold">Your OAuth app</h2>
          <p className="mt-1 text-muted">
            Registered once by you with the provider. It holds your client ID, redirect URLs and scopes. Reviews and
            user caps apply here.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Your integration</h2>
          <p className="mt-1 text-muted">
            Your code that runs the OAuth flow using that app. These guides cover what the provider requires, not
            how to write it.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Each user&rsquo;s connection</h2>
          <p className="mt-1 text-muted">
            One consent and token per end user. Some providers also need each customer&rsquo;s admin to approve
            your app, which can be the longest wait.
          </p>
        </div>
      </section>
    </>
  );
}
