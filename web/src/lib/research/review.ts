import { z } from "zod";
import type { GuideContent } from "../schema";
import { generateJson } from "./write";

const Review = z.object({
  headlineSupported: z.boolean().describe("true only if every figure and claim in the headline and nextAction is supported by the excerpts"),
  problem: z.string().nullable().describe("what in the headline or nextAction is unsupported, overstated or misleading"),
  headline: z.string().describe("the headline, rewritten only if needed to fix the problem; otherwise unchanged"),
  nextAction: z.string().describe("the next action, rewritten only if needed; otherwise unchanged"),
});

const SYSTEM = `You check one thing: whether a developer guide's headline and next action are accurate. You get the headline, the next action and the provider excerpts the guide was written from.

Look for these faults in the headline and next action:
- A number used for the wrong thing. For example a threshold that only starts a deadline, written as if it were the hard cap, or a limit for one route applied to all routes.
- A review time or limit that the excerpts do not state, or state differently.
- "Instant", "no review" or "self-serve" where the excerpts describe a review, approval or gate on any route the headline covers.
- Something true only for one route (private, unlisted, sandbox) presented as the whole story.
- A strong word the excerpts don't back. For every "requires", "must", "only", "all", "never", "always", "freezes", "blocked" or "after", find the excerpt that says it. Excerpts often say something is optional ("you're not required to list"), allowed any time ("you may submit anytime"), or conditional ("frozen if not approved within two weeks"). If the excerpt is softer or conditional, the headline is wrong.

Two real mistakes this check exists for:
- Written: "Public apps require Appstore listing." Excerpt: "you're not required to list your app on the Selling Partner Appstore." Fix: say listing is optional.
- Written: "freezes at 50 users until production review; requires 50 linked users first." Excerpt: "once your app links 50 Dropbox users, you will have two weeks to apply for and receive production status approval before your app's ability to link additional Dropbox users will be frozen" and "you may submit your request for production status anytime". Fix: the freeze only happens two weeks after reaching 50 users, and you can apply any time.

If you find a fault, rewrite the headline (one sentence) and/or next action so every figure is supported, keeping them short and actionable. Use only facts in the excerpts. If both are accurate, return them unchanged. Do not make them longer or vaguer to be safe.`;

// A second, narrow pass over the one sentence a reader trusts most. The
// writer sees every source at once and sometimes compresses a caveat away.
export async function reviewHeadline(
  guide: GuideContent,
  excerpts: string,
  onAttempt: (model: string, error?: string) => void,
): Promise<{ changed: boolean; problem: string | null; headline: string; nextAction: string; model: string }> {
  const prompt = [
    `Headline: ${guide.verdict.headline}`,
    `Next action: ${guide.verdict.nextAction}`,
    "",
    "Provider excerpts:",
    // About 4,500 tokens, so the check fits Groq's free 8,000-tokens-a-minute limit.
    excerpts.slice(0, 18_000),
  ].join("\n");
  const { content, model } = await generateJson(Review, SYSTEM, prompt, onAttempt, Infinity, "check");
  const changed = !content.headlineSupported && (content.headline !== guide.verdict.headline || content.nextAction !== guide.verdict.nextAction);
  return { changed, problem: content.problem, headline: content.headline, nextAction: content.nextAction, model };
}
