import type { Metadata } from "next";
import { EvidenceKey } from "@/components/Evidence";

export const metadata: Metadata = { title: "How guides are checked · OAuth Approval Paths" };

export default function Method() {
  return (
    <article className="max-w-[68ch] pt-12">
      <h1 className="text-3xl font-semibold tracking-tight">How guides are made and checked</h1>

      <h2 className="mt-10 text-lg font-semibold">Evidence tags</h2>
      <p className="mt-2">Every fact in a guide carries one of three marks and links to its sources.</p>
      <div className="mt-3"><EvidenceKey /></div>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li><strong>Confirmed</strong> means an agent opened the provider&rsquo;s own page and it says this.</li>
        <li><strong>Secondary</strong> means it comes from a blog, forum, integration vendor or a search excerpt, not a page we opened on the provider&rsquo;s site.</li>
        <li><strong>Not confirmed</strong> means it&rsquo;s inference, or we couldn&rsquo;t find a source. Treat it as a lead.</li>
      </ul>
      <p className="mt-3">
        Review times are only shown as numbers when the provider states them. Where it doesn&rsquo;t, the timeline is
        hatched and labelled &ldquo;review time not published&rdquo;. When a provider&rsquo;s own pages disagree, the guide shows
        both figures.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Library guides</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        <li>A research agent (Claude Opus 5.5) read each provider&rsquo;s developer docs and wrote notes with a tag and URL for every fact.</li>
        <li>A second agent mapped those notes into the guide format without adding facts. A validator checks the format and that every cited source exists.</li>
        <li>A separate agent re-opened the live pages for the highest-impact facts in five guides (Google, Slack, Microsoft, Salesforce, Notion): 29 facts, 21 matched, 6 corrected, 2 couldn&rsquo;t be verified. Corrections are listed at the bottom of each guide, and the full logs are in the repo.</li>
      </ol>

      <h2 className="mt-10 text-lg font-semibold">Live guides</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        <li>Plain code, with no AI, searches the web and reads the provider&rsquo;s own pages, keeping only the paragraphs about registration, review, limits and timelines. You see each search and page as it happens, and the log is saved with the guide.</li>
        <li>One model call (Gemini, with backups) turns those excerpts into the guide format. It can only cite the numbered sources it was given.</li>
        <li>
          A provenance check then runs in code, not in the model. A fact stays &ldquo;confirmed&rdquo; only if it cites a provider
          page we actually opened in that run. If it rests on a third-party page or a search snippet it drops to
          &ldquo;secondary&rdquo;, and if it cites nothing it becomes &ldquo;not confirmed&rdquo;. The guide says how many
          facts were downgraded.
        </li>
      </ol>
      <p className="mt-3">Live guides are not reviewed by a person and say so at the top.</p>

      <h2 className="mt-10 text-lg font-semibold">What agents can and can&rsquo;t do for you</h2>
      <p className="mt-2">
        Agents can find and read docs, draft scope justifications, privacy policy text, demo scripts and submission
        checklists. They can&rsquo;t create your app for you, because that needs your logged-in developer account. They also
        can&rsquo;t verify your domain, pay assessment fees, record your demo video or answer a reviewer as you. Each guide&rsquo;s
        &ldquo;Who does what&rdquo; section splits the work along this line.
      </p>
    </article>
  );
}
