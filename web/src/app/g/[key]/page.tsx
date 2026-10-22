import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSaved } from "@/lib/store";
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
  const notice = (
    <div className="mt-2 text-[13px] text-muted">
      <p className="flex flex-wrap items-center gap-x-2">
        <span className="rounded-full bg-agent/10 px-2 py-0.5 font-medium text-agent">Researched live by an agent</span>
        <span>
          {formatDate(guide.researchedOn)}. Not yet checked by a person, so treat &ldquo;not confirmed&rdquo; items as leads.
        </span>
      </p>
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
