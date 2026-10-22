import type { Metadata } from "next";
import { library } from "@/guides";
import { Generator, type Sample } from "@/components/Generator";
import { dailyLeft, getSaved, listSaved, runsLeft, RUN_LIMIT } from "@/lib/store";
import { currentVisitor } from "@/lib/visitor";

export const metadata: Metadata = { title: "Research an app · OAuth Approval Paths" };
export const dynamic = "force-dynamic";

async function latestSample(slugs: string[]): Promise<Sample | null> {
  for (const slug of slugs) {
    const g = await getSaved(slug);
    if (g?.researchLog?.length) return { name: g.name, slug: g.slug, researchedOn: g.researchedOn, log: g.researchLog };
  }
  return null;
}

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ app?: string }> }) {
  const { app } = await searchParams;
  const [mine, today, saved] = await Promise.all([currentVisitor().then(runsLeft), dailyLeft(), listSaved()]);
  const left = Math.min(mine, today);
  return (
    <Generator
      known={library.map(({ slug, name }) => ({ slug, name }))}
      saved={saved}
      sample={await latestSample(saved.map((s) => s.slug))}
      initial={app ?? ""}
      runsLeft={Number.isFinite(left) ? left : null}
      runLimit={RUN_LIMIT}
    />
  );
}
