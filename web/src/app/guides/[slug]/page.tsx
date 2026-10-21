import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuide, library } from "@/guides";
import { GuideView } from "@/components/GuideView";
import { GuideActions } from "@/components/GuideActions";

export const dynamicParams = false;
export const generateStaticParams = () => library.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  return g ? { title: `${g.name} OAuth app guide`, description: g.verdict.headline } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return (
    <>
      <GuideActions guide={guide} />
      <GuideView guide={guide} />
    </>
  );
}
