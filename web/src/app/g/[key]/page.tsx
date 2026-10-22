import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSaved } from "@/lib/store";
import { GuideView } from "@/components/GuideView";
import { GuideActions } from "@/components/GuideActions";

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
      <p className="mt-6 max-w-3xl border-l-4 border-agent bg-surface px-4 py-3 text-sm">
        An agent researched this guide on {guide.researchedOn}, and a person hasn&rsquo;t checked it yet. It&rsquo;s saved, so
        everyone who asks for {guide.name} sees this same version. Treat anything marked &ldquo;not confirmed&rdquo; as a lead.
      </p>
      <GuideActions guide={guide} />
      <GuideView guide={guide} />
    </>
  );
}
