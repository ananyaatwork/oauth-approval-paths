import type { Guide, Step } from "@/lib/schema";
import { Evidence, EvidenceKey } from "./Evidence";
import { PathTimeline } from "./PathTimeline";
import { Checklist } from "./Checklist";
import { GuideNav, type NavItem } from "./GuideNav";
import { formatDate } from "@/lib/dates";
import { VerdictPanel } from "./VerdictPanel";
import { RouteSpread } from "./RouteSpread";
import { COMPOSIO_LIST_DATE, composioManaged } from "@/lib/managed";

const STALE_AFTER_DAYS = 90;

const OWNER_LABEL: Record<Step["owner"], string> = {
  agent: "Agent",
  you: "You",
  provider: "Provider",
  customer_admin: "Customer admin",
};
const OWNER_DOT: Record<Step["owner"], string> = {
  agent: "bg-agent",
  you: "bg-you",
  provider: "bg-provider",
  customer_admin: "bg-customer",
};

// One glyph per kind of section, so each part of a long guide is findable at a glance.
const ICON: Record<string, React.ReactNode> = {
  time: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></>,
  blockers: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  split: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5M17.5 14a5.5 5.5 0 0 1 3 5" /></>,
  steps: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  checklist: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  gotchas: <><path d="M12 4 3 19h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></>,
  blocked: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m6.3 6.3 3.6 3.6M14.1 14.1l3.6 3.6M17.7 6.3l-3.6 3.6M9.9 14.1l-3.6 3.6" /></>,
  unknowns: <><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.2M12 17h.01" /></>,
  sources: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
};

// Each section opens with a divider and a large heading marked by its glyph,
// so the page reads as distinct parts rather than one long run of text.
function Section({ id, title, children, aside }: { id: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="anchor mt-14 border-t border-line pt-10 first:mt-0 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id={`${id}-h`} className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {ICON[id]}
            </svg>
          </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function GuideView({ guide, actions, notice }: { guide: Guide; actions?: React.ReactNode; notice?: React.ReactNode }) {
  const sourceInfo = Object.fromEntries(
    guide.sources.map((s) => [s.id, `${s.title} · ${s.kind === "primary" ? "provider's docs" : "secondary"} · accessed ${formatDate(s.accessed)}`]),
  );
  const stepNo = new Map(guide.steps.map((s, i) => [s, i + 1]));
  const agentSteps = guide.steps.filter((s) => s.owner === "agent");
  const youSteps = guide.steps.filter((s) => s.owner === "you");
  const helped = youSteps.filter((s) => s.agentHelp);
  const waitSteps = guide.steps.filter((s) => s.owner === "provider" || s.owner === "customer_admin");
  const primary = guide.sources.filter((s) => s.kind === "primary").length;
  const confirmed = [...guide.steps, ...guide.gotchas, ...guide.prerequisites, ...guide.beforeApproval, ...guide.submissionChecklist].filter(
    (c) => c.confidence === "confirmed",
  ).length;
  const facts = guide.steps.length + guide.gotchas.length + guide.prerequisites.length + guide.beforeApproval.length + guide.submissionChecklist.length;

  const managed = composioManaged(guide.name);
  const ageDays = Math.floor((Date.now() - Date.parse(guide.researchedOn)) / 86_400_000);

  const nav: NavItem[] = [
    { id: "time", label: "Timeline" },
    { id: "blockers", label: "Blockers" },
    { id: "split", label: "Who does what" },
    { id: "steps", label: "Steps" },
    ...(guide.submissionChecklist.length ? [{ id: "checklist", label: "Checklist" }] : []),
    { id: "gotchas", label: "Watch out for" },
    { id: "blocked", label: "If you're blocked" },
    { id: "unknowns", label: "Not confirmed" },
    { id: "sources", label: "Sources" },
  ];

  // The provider's own pages, in the order the steps first need them, so the
  // official setup docs are one click from the top of the guide.
  const firstUse = (id: string) => {
    const i = guide.steps.findIndex((s) => s.sources.includes(id));
    return i < 0 ? Infinity : i;
  };
  const setupPages = guide.sources
    .filter((s) => s.kind === "primary" && /^https?:\/\//.test(s.url))
    .map((s, order) => ({ s, at: firstUse(s.id), order }))
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .slice(0, 6)
    .map(({ s }) => s);

  // Page titles from the web often carry the site name or an export prefix
  // ("Microsoft Word - Terms - SecurePay: ..."); keep the part that names the page.
  const pageTitle = (t: string) => {
    const parts = t.replace(/^Microsoft Word\s*-\s*/i, "").split(/\s+[-|–—]\s+/);
    return (parts[0].length >= 3 ? parts[0] : t).trim();
  };
  const pageAddress = (u: string) => {
    try {
      const { hostname, pathname } = new URL(u);
      return (hostname.replace(/^www\./, "") + pathname).replace(/\/$/, "");
    } catch {
      return u;
    }
  };

  const StepRef = ({ s }: { s: Step }) => (
    <a href={`#step-${stepNo.get(s)}`} className="text-muted hover:text-ink">
      {stepNo.get(s)}.
    </a>
  );

  return (
    <article className="pt-8 [overflow-wrap:anywhere]">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{guide.name}</h1>
        {notice}
        <p className="mt-3 max-w-[70ch] text-lg leading-snug">{guide.verdict.headline}</p>
        <VerdictPanel guide={guide} sourceInfo={sourceInfo} />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-[72ch] flex-1 gap-3">
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-you/15 text-you">→</span>
            <div>
              <p className="text-[13px] text-muted">Do this next</p>
              <p className="mt-0.5 font-medium">{guide.verdict.nextAction}</p>
            </div>
          </div>
          {actions}
        </div>
        {setupPages.length > 0 && (
          <nav aria-labelledby="setup-pages" className="mt-6 max-w-3xl">
            <h2 id="setup-pages" className="text-[15px] font-semibold">
              {guide.name.split(" (")[0]}&rsquo;s setup pages
            </h2>
            <ul className="mt-2 grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              {setupPages.map((s) => (
                <li key={s.id} className="min-w-0">
                  <a href={s.url} target="_blank" rel="noreferrer" className="group block min-w-0" title={s.title}>
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate font-medium underline decoration-line underline-offset-2 group-hover:decoration-ink">
                        {pageTitle(s.title)}
                      </span>
                      <span aria-hidden className="text-muted group-hover:text-ink">↗</span>
                    </span>
                    <span className="block truncate text-[13px] text-muted">{pageAddress(s.url)}</span>
                  </a>
                </li>
              ))}
            </ul>
            {guide.sources.length > setupPages.length && (
              <a href="#sources" className="mt-2 inline-block text-[13px] text-muted underline underline-offset-2 hover:text-ink">
                All {guide.sources.length} sources
              </a>
            )}
          </nav>
        )}
        <p className="mt-5 text-[13px] text-muted">
          {guide.origin === "library" ? "Library guide" : "Generated live by an agent"}, researched {formatDate(guide.researchedOn)}
          {guide.model ? ` with ${guide.model}` : ""}. {guide.sources.length} sources, {primary} from the provider. {confirmed} of {facts} facts
          confirmed on provider pages.{" "}
          {guide.verification
            ? `${guide.verification.claimsChecked} facts re-checked against live pages by ${guide.verification.checkedBy === "human" ? "a person" : "an independent agent"} on ${formatDate(guide.verification.checkedOn)}.`
            : "Not yet re-checked."}
        </p>
        {ageDays >= STALE_AFTER_DAYS && (
          <p className="mt-3 max-w-[72ch] rounded-lg border border-line bg-surface-2 p-3 text-sm">
            This guide was researched {ageDays} days ago. Review times, caps and consent rules have changed at several providers within a few
            months, so check the provider&rsquo;s pages before relying on a number.
          </p>
        )}
        <p className="mt-3 max-w-[72ch] text-sm">
          <span className="font-medium">Composio-managed OAuth:</span>{" "}
          {managed.exact
            ? `Yes. Composio supplies the OAuth app for ${managed.toolkits.join(", ")}, so you can connect users without doing any of this.`
            : managed.managed
              ? `Partly. Composio supplies the OAuth app for related ${guide.name.split(" ")[0]} toolkits (${managed.toolkits.join(", ")}), not necessarily this one. Check the toolkit page.`
              : "No. Composio doesn\u2019t supply an OAuth app for this one, so you register your own and get it approved."}{" "}
          {managed.managed && "You still need this guide for your own name on the consent screen, scopes beyond Composio\u2019s defaults, your own rate-limit quota, or a marketplace listing."}{" "}
          <span className="text-muted">Composio&rsquo;s list as copied {formatDate(COMPOSIO_LIST_DATE)}.</span>
        </p>
        {guide.appType && (
          <p className="mt-2 max-w-[72ch] text-sm">
            <span className="font-medium">App type:</span> {guide.appType}
          </p>
        )}
        <div className="mt-4">
          <EvidenceKey />
        </div>
      </header>

      <div className="lg:mt-12 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        <GuideNav items={nav} />
        <div className="mt-10 lg:mt-0">
          <Section
            id="time"
            title="How long until production"
            aside={<span className="text-[13px] text-muted">Hatched: review time not published</span>}
          >
            <RouteSpread paths={guide.paths} />
            <div className="grid gap-10">
              {guide.paths.map((p) => (
                <PathTimeline key={p.name} path={p} />
              ))}
            </div>
          </Section>

          <Section
            id="blockers"
            title="Blockers and what works today"
          >
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">What blocks you from submitting</h3>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {guide.prerequisites.map((i) => (
                    <li key={i.item} className="py-3 first:pt-0">
                      <span className="font-medium">{i.item}</span> <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />
                      {i.detail && <span className="block text-muted">{i.detail}</span>}
                    </li>
                  ))}
                  {!guide.prerequisites.length && <li className="text-muted">Nothing found that blocks submission.</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">What works before approval</h3>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {guide.beforeApproval.map((i) => (
                    <li key={i.item} className="py-3 first:pt-0">
                      <span className="font-medium">{i.item}</span> <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />
                      {i.detail && <span className="block text-muted">{i.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="split" title="Who does what">
            <p className="mb-5 max-w-[68ch] text-sm">
              An agent can do <strong>{agentSteps.length}</strong> of {guide.steps.length} steps
              {helped.length > 0 && (
                <>
                  {" "}and help you prepare <strong>{helped.length}</strong> more
                </>
              )}
              . The rest need your login, money, legal identity or a decision, or are waits on someone else.
            </p>
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
              <div className="tile p-4">
                <h3 className="flex items-center gap-2 font-medium"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-agent" />An agent can do</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {agentSteps.map((s) => (
                    <li key={s.title}><StepRef s={s} /> {s.title}</li>
                  ))}
                  {helped.map((s) => (
                    <li key={`h-${s.title}`} className="text-muted">
                      <StepRef s={s} /> Prepare: {s.agentHelp}
                    </li>
                  ))}
                  {!agentSteps.length && !helped.length && <li className="text-muted">Research and checklists only.</li>}
                </ul>
              </div>
              <div className="tile p-4">
                <h3 className="flex items-center gap-2 font-medium"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-you" />You need to do</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {youSteps.map((s) => (
                    <li key={s.title}><StepRef s={s} /> {s.title}</li>
                  ))}
                </ul>
              </div>
              <div className="tile p-4">
                <h3 className="flex items-center gap-2 font-medium"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-provider" />You wait on</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {waitSteps.map((s) => (
                    <li key={s.title}>
                      <StepRef s={s} /> {s.title} <span className="text-muted">({OWNER_LABEL[s.owner].toLowerCase()})</span>
                    </li>
                  ))}
                  {!waitSteps.length && <li className="text-muted">No review or approval found.</li>}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="steps" title="Steps">
            <ol className="space-y-6">
              {guide.steps.map((s, i) => (
                <li key={s.title} id={`step-${i + 1}`} className="anchor grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-sm font-semibold text-muted tabular-nums">{i + 1}</span>
                  <div className="max-w-[72ch]">
                    <p className="font-medium">
                      {s.url ? (
                        <a href={s.url} className="underline decoration-line underline-offset-2 hover:decoration-ink" target="_blank" rel="noreferrer">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${OWNER_DOT[s.owner]}`} />
                        {OWNER_LABEL[s.owner]}
                      </span>
                      <Evidence level={s.confidence} sources={s.sources} sourceInfo={sourceInfo} />
                    </p>
                    <p className="mt-1.5 text-sm">{s.detail}</p>
                    {s.agentHelp && (
                      <p className="mt-2 inline-block rounded-md bg-agent/10 px-2.5 py-1 text-sm text-agent">An agent can prepare: {s.agentHelp}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {guide.submissionChecklist.length > 0 && (
            <Section id="checklist" title="What to have ready for review" aside={<span className="text-[13px] text-muted">Tick items as you go</span>}>
              <Checklist
                storageKey={`checklist:${guide.origin}:${guide.slug}`}
                items={guide.submissionChecklist.map((i, n) => ({
                  id: String(n),
                  label: i.item,
                  evidence: <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />,
                  detail: i.detail,
                }))}
              />
            </Section>
          )}

          <Section id="gotchas" title="Watch out for">
            <ul className="grid gap-x-10 text-sm md:grid-cols-2">
              {guide.gotchas.map((g) => (
                <li key={g.title} className="border-t border-line py-4">
                  <p className="font-medium">
                    {g.title} <Evidence level={g.confidence} sources={g.sources} sourceInfo={sourceInfo} />
                  </p>
                  <p className="mt-0.5 text-muted">{g.detail}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="blocked" title="If you're blocked">
            <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
              <ul className="divide-y divide-line text-sm">
                {guide.blockers.map((b) => (
                  <li key={b.symptom} className="py-4 first:pt-0">
                    <p className="font-medium">{b.symptom}</p>
                    <p className="mt-0.5">{b.whatToDo}</p>
                    {b.contact && <p className="mt-0.5 text-muted">{b.contact}</p>}
                  </li>
                ))}
              </ul>
              <div className="text-sm">
                <h3 className="font-medium">Where to ask</h3>
                <ul className="mt-2 space-y-2">
                  {guide.escalation.channels.map((c) => (
                    <li key={c.label}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">
                          {c.label}
                        </a>
                      ) : (
                        c.label
                      )}
                      {c.note && <span className="block text-muted">{c.note}</span>}
                    </li>
                  ))}
                </ul>
                {guide.escalation.haveReady.length > 0 && (
                  <>
                    <h3 className="mt-5 font-medium">Have this ready when you ask</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {guide.escalation.haveReady.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </Section>

          <Section id="unknowns" title="What we couldn't confirm">
            {guide.unknowns.length ? (
              <ul className="max-w-[72ch] list-disc space-y-1.5 pl-5 text-sm">
                {guide.unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing flagged.</p>
            )}
            {guide.verification && guide.verification.corrections.length > 0 && (
              <div className="mt-6 text-sm">
                <h3 className="font-medium">Corrected after a re-check on {formatDate(guide.verification.checkedOn)}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {guide.verification.corrections.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section id="sources" title="Sources">
            <ol className="space-y-2 text-sm">
              {guide.sources.map((s) => (
                <li key={s.id} id={`src-${s.id}`} className="anchor grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 target:bg-surface">
                  <span className="text-muted">{s.id}</span>
                  <span>
                    {/^https?:\/\//.test(s.url) ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                    <span className="text-muted"> · {s.kind === "primary" ? "provider's own docs" : "secondary"} · accessed {formatDate(s.accessed)}</span>
                    <span className="block text-muted">{s.supports}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </article>
  );
}
