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
  return (
    <>
      <div className="mt-6 max-w-3xl border-l-[3px] border-agent bg-surface px-4 py-3 text-sm">
        <p>
          An agent researched this guide on {formatDate(guide.researchedOn)}, and a person hasn&rsquo;t checked it yet. It&rsquo;s
          saved, so everyone who asks for {guide.name} sees this same version. Treat anything marked &ldquo;not confirmed&rdquo;
          as a lead.
        </p>
        {guide.researchLog?.length ? (
          <details className="mt-2">
            <summary className="cursor-pointer">
              <span className="font-medium">How the agent got here</span>{" "}
              <span className="text-muted">
                (<ResearchLogSummary lines={guide.researchLog} />)
              </span>
            </summary>
            <div className="mt-3 border-t border-line pt-3">
              <ResearchLog lines={guide.researchLog} />
            </div>
          </details>
        ) : null}
      </div>
      <GuideView guide={guide} actions={<GuideActions guide={guide} />} />
    </>
  );
}
