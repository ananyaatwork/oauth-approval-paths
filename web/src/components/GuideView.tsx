import type { Guide, Step } from "@/lib/schema";
import { Evidence, EvidenceKey } from "./Evidence";
import { PathTimeline } from "./PathTimeline";
import { Checklist } from "./Checklist";
import { GuideNav, type NavItem } from "./GuideNav";
import { formatDate } from "@/lib/dates";
import { VerdictPanel } from "./VerdictPanel";

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

function Section({ id, title, children, aside }: { id: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-20 first:mt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Collapsible({ id, title, meta, children }: { id: string; title: string; meta: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <h2 className="text-lg font-semibold tracking-tight">
            <span aria-hidden className="mr-2 inline-block text-muted transition-transform duration-150 group-open:rotate-90">›</span>
            {title}
          </h2>
          <span className="text-sm text-muted">{meta}</span>
        </summary>
        <div className="mt-4">{children}</div>
      </details>
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

  const nav: NavItem[] = [
    { id: "time", label: "Timeline" },
    { id: "blockers", label: "Blockers" },
    { id: "split", label: "Who does what" },
    { id: "steps", label: "Steps" },
    ...(guide.submissionChecklist.length ? [{ id: "checklist", label: "Checklist" }] : []),
    { id: "gotchas", label: "Gotchas" },
    { id: "blocked", label: "If you're blocked" },
    { id: "unknowns", label: "Not confirmed" },
    { id: "sources", label: "Sources" },
  ];

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
        <p className="mt-5 text-[13px] text-muted">
          {guide.origin === "library" ? "Library guide" : "Generated live by an agent"}, researched {formatDate(guide.researchedOn)}
          {guide.model ? ` with ${guide.model}` : ""}. {guide.sources.length} sources, {primary} from the provider. {confirmed} of {facts} facts
          confirmed on provider pages.{" "}
          {guide.verification
            ? `${guide.verification.claimsChecked} facts re-checked against live pages by ${guide.verification.checkedBy === "human" ? "a person" : "an independent agent"} on ${formatDate(guide.verification.checkedOn)}.`
            : "Not yet re-checked."}
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
          <Section id="time" title="How long until production" aside={<span className="text-[13px] text-muted">Hatched: review time not published</span>}>
            <div className="grid gap-10">
              {guide.paths.map((p) => (
                <PathTimeline key={p.name} path={p} />
              ))}
            </div>
          </Section>

          <Section id="blockers" title="Blockers and what works today">
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div>
                <h3 className="font-medium">What blocks you from submitting</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {guide.prerequisites.map((i) => (
                    <li key={i.item}>
                      {i.item} <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />
                      {i.detail && <span className="block text-muted">{i.detail}</span>}
                    </li>
                  ))}
                  {!guide.prerequisites.length && <li className="text-muted">Nothing found that blocks submission.</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">What works before approval</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {guide.beforeApproval.map((i) => (
                    <li key={i.item}>
                      {i.item} <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />
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
                <li key={s.title} id={`step-${i + 1}`} className="grid scroll-mt-24 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
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
            <Collapsible id="checklist" title="What to have ready for review" meta={`${guide.submissionChecklist.length} items, tick as you go`}>
              <Checklist
                storageKey={`checklist:${guide.origin}:${guide.slug}`}
                items={guide.submissionChecklist.map((i, n) => ({
                  id: String(n),
                  label: (
                    <>
                      {i.item} <Evidence level={i.confidence} sources={i.sources} sourceInfo={sourceInfo} />
                    </>
                  ),
                  detail: i.detail,
                }))}
              />
            </Collapsible>
          )}

          <Collapsible id="gotchas" title="Things that catch people out" meta={`${guide.gotchas.length} gotchas`}>
            <ul className="grid gap-x-10 gap-y-4 text-sm md:grid-cols-2">
              {guide.gotchas.map((g) => (
                <li key={g.title}>
                  <p className="font-medium">
                    {g.title} <Evidence level={g.confidence} sources={g.sources} sourceInfo={sourceInfo} />
                  </p>
                  <p className="mt-0.5 text-muted">{g.detail}</p>
                </li>
              ))}
            </ul>
          </Collapsible>

          <Section id="blocked" title="If you're blocked">
            <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
              <ul className="space-y-4 text-sm">
                {guide.blockers.map((b) => (
                  <li key={b.symptom}>
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
                <li key={s.id} id={`src-${s.id}`} className="grid scroll-mt-20 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 target:bg-surface lg:scroll-mt-6">
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
