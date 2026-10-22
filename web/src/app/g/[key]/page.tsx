import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ageInDays, canRefresh, getSaved, REFRESH_AFTER_DAYS } from "@/lib/store";
import { GuideView } from "@/components/GuideView";
import { GuideActions } from "@/components/GuideActions";
import { ResearchLog, ResearchLogSummary } from "@/components/ResearchLog";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const g = await getSaved((await params).key);
  return g ? { title: `${g.name} OAuth app guide`, description: g.verdict.headline } : {};
}

export default async function SavedGuidePage({ params }: { params: Promise<{ key: string }> }) {
  const guide = await getSaved((await params).key);
  if (!guide) notFound();
  const age = ageInDays(guide);
  const refreshOn = new Date(Date.parse(guide.researchedOn) + REFRESH_AFTER_DAYS * 86_400_000).toISOString().slice(0, 10);
  const refresh = canRefresh(guide) ? (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span>
        Researched {age} days ago. Provider rules change, so this may be out of date.
      </span>
      <Link href={`/generate?app=${encodeURIComponent(guide.name)}&refresh=1`} className="btn-ghost px-3 py-1 text-ink">
        Research again
      </Link>
    </p>
  ) : (
    <p className="mt-1.5">It can be researched again from {formatDate(refreshOn)}.</p>
  );
  const notice = (
    <div className="mt-2 text-[13px] text-muted">
      <p className="flex flex-wrap items-center gap-x-2">
        <span className="rounded-full bg-agent/10 px-2 py-0.5 font-medium text-agent">Researched live by an agent</span>
        <span>
          {formatDate(guide.researchedOn)}. Not yet checked by a person, so treat &ldquo;not confirmed&rdquo; items as leads.
        </span>
      </p>
      {refresh}
      {guide.researchLog?.length ? (
        <details className="mt-1.5">
          <summary className="cursor-pointer hover:text-ink">
            How the agent got here (<ResearchLogSummary lines={guide.researchLog} />)
          </summary>
          <div className="mt-2 max-w-3xl rounded-md border border-line bg-surface p-4 text-ink">
            <ResearchLog lines={guide.researchLog} />
          </div>
        </details>
      ) : null}
    </div>
  );
  return <GuideView guide={guide} notice={notice} actions={<GuideActions guide={guide} />} />;
}
