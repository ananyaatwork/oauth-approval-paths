import type { Metadata } from "next";
import { library } from "@/guides";
import { Generator } from "@/components/Generator";
import { listSaved, runsLeft, RUN_LIMIT } from "@/lib/store";
import { currentVisitor } from "@/lib/visitor";

export const metadata: Metadata = { title: "Research an app · OAuth Approval Paths" };
export const dynamic = "force-dynamic";

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ app?: string }> }) {
  const { app } = await searchParams;
  const left = await runsLeft(await currentVisitor());
  return (
    <Generator
      known={library.map(({ slug, name }) => ({ slug, name }))}
      saved={await listSaved()}
      initial={app ?? ""}
      runsLeft={Number.isFinite(left) ? left : null}
      runLimit={RUN_LIMIT}
    />
  );
}
