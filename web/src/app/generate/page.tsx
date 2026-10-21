import type { Metadata } from "next";
import { library } from "@/guides";
import { Generator } from "@/components/Generator";

export const metadata: Metadata = { title: "Research an app · OAuth Approval Paths" };

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ app?: string }> }) {
  const { app } = await searchParams;
  return <Generator known={library.map(({ slug, name }) => ({ slug, name }))} initial={app ?? ""} />;
}
