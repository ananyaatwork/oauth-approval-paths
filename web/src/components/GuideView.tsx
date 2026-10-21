import type { Guide, Step } from "@/lib/schema";
import { Evidence, EvidenceKey } from "./Evidence";
import { PathTimeline } from "./PathTimeline";

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
    <section id={id} className="mt-12 scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function GuideView({ guide }: { guide: Guide }) {
  const titles = Object.fromEntries(guide.sources.map((s) => [s.id, s.title]));
  const agentSteps = guide.steps.filter((s) => s.owner === "agent");
  const youSteps = guide.steps.filter((s) => s.owner === "you");
  const waitSteps = guide.steps.filter((s) => s.owner === "provider" || s.owner === "customer_admin");
  const primary = guide.sources.filter((s) => s.kind === "primary").length;

  return (
    <article className="pt-10">
      <p className="text-sm text-muted">
        {guide.origin === "library" ? "Library guide" : "Generated live"}, researched {guide.researchedOn}
        {guide.model ? ` with ${guide.model}` : ""} · {guide.sources.length} sources ({primary} from the provider)
        {guide.verification ? ` · ${guide.verification.claimsChecked} claims spot-checked by a ${guide.verification.checkedBy}` : " · not yet spot-checked"}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{guide.name}</h1>
      <p className="mt-4 max-w-[68ch] text-xl leading-snug">{guide.verdict.headline}</p>
      <div className="mt-5 max-w-[68ch] border-l-4 border-you bg-surface px-4 py-3">
        <p className="text-sm text-muted">Do this next</p>
        <p className="mt-0.5 font-medium">{guide.verdict.nextAction}</p>
      </div>
      {guide.appType && <p className="mt-4 max-w-[68ch] text-sm"><span className="font-medium">App type:</span> {guide.appType}</p>}

      <Section id="time" title="How long until production" aside={<span className="text-sm text-muted">Hatched = no stated SLA</span>}>
        <div className="grid gap-10">
          {guide.paths.map((p) => (
            <PathTimeline key={p.name} path={p} />
          ))}
        </div>
      </Section>

      <Section id="split" title="Who does what">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full bg-agent" /> An agent can do</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {agentSteps.map((s) => <li key={s.title}>{s.title}</li>)}
              {youSteps.filter((s) => s.agentHelp).map((s) => (
                <li key={`help-${s.title}`} className="text-muted">Prepare: {s.agentHelp}</li>
              ))}
              {!agentSteps.length && !youSteps.some((s) => s.agentHelp) && <li className="text-muted">Research and checklists only.</li>}
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full bg-you" /> You need to do</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {youSteps.map((s) => <li key={s.title}>{s.title}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full bg-provider" /> You wait on</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {waitSteps.map((s) => (
                <li key={s.title}>
                  {s.title} <span className="text-muted">({OWNER_LABEL[s.owner].toLowerCase()})</span>
                </li>
              ))}
              {!waitSteps.length && <li className="text-muted">No review or approval found.</li>}
            </ul>
          </div>
        </div>
      </Section>

      <div className="grid gap-x-10 md:grid-cols-2">
        <Section id="before" title="What works before approval">
          <ul className="space-y-3 text-sm">
            {guide.beforeApproval.map((i) => (
              <li key={i.item}>
                {i.item} <Evidence level={i.confidence} sources={i.sources} titles={titles} />
                {i.detail && <span className="block text-muted">{i.detail}</span>}
              </li>
            ))}
          </ul>
        </Section>
        <Section id="prereq" title="What blocks you from submitting">
          <ul className="space-y-3 text-sm">
            {guide.prerequisites.map((i) => (
              <li key={i.item}>
                {i.item} <Evidence level={i.confidence} sources={i.sources} titles={titles} />
                {i.detail && <span className="block text-muted">{i.detail}</span>}
              </li>
            ))}
            {!guide.prerequisites.length && <li className="text-muted">Nothing found that blocks submission.</li>}
          </ul>
        </Section>
      </div>

      <Section id="steps" title="Steps" aside={<EvidenceKey />}>
        <ol className="space-y-5">
          {guide.steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-x-3">
              <span className="text-lg font-semibold text-muted">{i + 1}</span>
              <div className="max-w-[72ch]">
                <p className="font-medium">
                  {s.url ? <a href={s.url} className="underline decoration-line underline-offset-2 hover:decoration-ink" target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${OWNER_DOT[s.owner]}`} />{OWNER_LABEL[s.owner]}</span>
                  <Evidence level={s.confidence} sources={s.sources} titles={titles} />
                </p>
                <p className="mt-1.5 text-sm">{s.detail}</p>
                {s.agentHelp && <p className="mt-1.5 text-sm text-agent">An agent can prepare: {s.agentHelp}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {guide.submissionChecklist.length > 0 && (
        <Section id="checklist" title="What to have ready for review">
          <ul className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
            {guide.submissionChecklist.map((i) => (
              <li key={i.item} className="flex gap-2">
                <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-[3px] border border-muted" />
                <span>
                  {i.item} <Evidence level={i.confidence} sources={i.sources} titles={titles} />
                  {i.detail && <span className="block text-muted">{i.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="gotchas" title="Things that catch people out">
        <ul className="grid gap-x-10 gap-y-4 text-sm md:grid-cols-2">
          {guide.gotchas.map((g) => (
            <li key={g.title}>
              <p className="font-medium">{g.title} <Evidence level={g.confidence} sources={g.sources} titles={titles} /></p>
              <p className="mt-0.5 text-muted">{g.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

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
                  {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">{c.label}</a> : c.label}
                  {c.note && <span className="block text-muted">{c.note}</span>}
                </li>
              ))}
            </ul>
            {guide.escalation.haveReady.length > 0 && (
              <>
                <h3 className="mt-5 font-medium">Have this ready when you ask</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {guide.escalation.haveReady.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>
      </Section>

      <Section id="unknowns" title="What we couldn't confirm">
        {guide.unknowns.length ? (
          <ul className="max-w-[72ch] list-disc space-y-1.5 pl-5 text-sm">
            {guide.unknowns.map((u) => <li key={u}>{u}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing flagged.</p>
        )}
        {guide.verification && guide.verification.corrections.length > 0 && (
          <div className="mt-6 text-sm">
            <h3 className="font-medium">Corrected after a spot-check on {guide.verification.checkedOn}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {guide.verification.corrections.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        )}
      </Section>

      <Section id="sources" title="Sources">
        <ol className="space-y-2 text-sm">
          {guide.sources.map((s) => (
            <li key={s.id} id={`src-${s.id}`} className="grid grid-cols-[2.5rem_1fr] gap-x-2 scroll-mt-6 target:bg-surface">
              <span className="text-muted">{s.id}</span>
              <span>
                {/^https?:\/\//.test(s.url) ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">{s.title}</a>
                ) : (
                  s.title
                )}
                <span className="text-muted"> · {s.kind === "primary" ? "provider's own docs" : "secondary"} · accessed {s.accessed}</span>
                <span className="block text-muted">{s.supports}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}
