# Next steps

Where the project stands as of 2026-10-23, and what is left, in the order I'd do it. Work one item at a time and check each before starting the next.

## What this project is (and isn't)

It is a guide library and a live research agent about **registering an OAuth app with a provider and getting it approved**: how long it takes, what blocks you, who you wait on, and what an agent can do for you.

It does **not** perform OAuth, register apps, submit apps for review, or do business verification. Where a guide mentions business verification (LinkedIn's legal entity, PayPal's merchant checks), it is information for the developer.

## Done on this branch

- **Verified the other five guides** (GitHub, QuickBooks, Zoom, HubSpot, LinkedIn). With the first five, 65 facts across all 10 guides were re-checked: 53 matched, 8 corrected, 4 could not be verified. Logs: `research/verification/`.
- **Composio-managed badge** on every guide (`web/src/lib/managed.ts`), from a copy of Composio's list dated 2026-10-22. "Yes", "Partly" (related products from the same company) or "No".
- **Headline check** (`web/src/lib/research/review.ts`): a second narrow model call checks the headline and next action against provider excerpts and rewrites them if a figure isn't supported. **Not yet run against a real model.**
- **Reviewer link**: set `REVIEWER_KEY`, open `/generate?reviewer=<key>` to skip the per-browser and daily limits. **Not yet tested end to end.**
- **Difficulty rubric (1 to 5)** in the writer prompt and on `/method`; **staleness warning** on guides older than 90 days.
- **`reconnect` field** in the schema (how often a user must log in or re-consent). Optional, so the old guides still validate.
- **README fixes**: placeholder filled, garbled dash fixed, setup and deploy keys corrected, verification numbers updated, UI-gate section moved to the end.
- **Spotify guide** written and independently re-checked (8 facts: 7 matched, 1 corrected). It is **not yet in `web/src/guides/index.ts`**, so it doesn't show on the site.

Checks that pass: `tsc --noEmit`, `npm run lint`, `npm run validate`, `npm run slop-gate`. The app has not been run in a browser.

## To do, in order

1. **Add Spotify to the library** (`web/src/guides/index.ts`) and look at it in the browser.
2. **Research the other new apps, one at a time**, each followed by an independent re-check:
   Pipedrive, Xero, DocuSign, Shopify, PayPal, Mollie, Razorpay, Etsy, eBay, Amazon SP-API.
   Why these: none are on Composio's managed list, so a developer must register and get approved themselves. They include two payment gateways (app approval and merchant verification are separate gates) and one provider from a developing market. Keep the same rules: provider pages only, "confirmed" only if opened, never invent a review time, list unknowns.
3. **Back-fill `reconnect`** on the 10 original guides, using sources already in each guide.
4. **Readiness checker** ("Check your app" section on each guide). The developer enters their homepage, privacy policy URL, redirect URIs and scopes. Code (no model, so no quota) checks: URLs load over HTTPS, the privacy page has real content and is on the same domain, redirect URIs are valid (no wildcards, HTTPS except localhost), and which scopes the guide flags as stricter review. Needs an SSRF guard (block private IPs, limit redirects, timeout, per-visitor rate limit).
5. **Submission pack**: the agent drafts scope justifications, a reviewer demo script and a support email for the developer to send. Needs a model key to test, so it can't be verified without one.
6. **Tested attempts** ("tested by us", a level above "confirmed from docs"), simple to complex:
   1. GitHub App: about 10 minutes, no review.
   2. Slack app or Notion integration: instant for your own workspace, distribution is gated.
   3. Google OAuth consent screen up to the "submit for verification" step, without submitting: shows the 100-user cap, the unverified-app warning and the 7-day token expiry in testing mode.
   Needs a logged-in developer account. Record time taken, fields asked for, and where the console differs from the docs.
7. **Live demo test on a random app from a developing market** (Mercado Libre, Tiendanube, Bling, Kommo or Bitrix24) with the reviewer link. Report what the agent gets wrong. Needs the API keys below.
8. **Pre-warm** a few likely apps so a reviewer sees a saved guide instantly, and check the progress display during the 60 to 90 second wait.

## Needs from you

- `web/.env.local` with `GEMINI_API_KEY`, `TAVILY_API_KEY` (or `SERPER_API_KEY`) and `REVIEWER_KEY`. Never commit it (`.env*` is gitignored). Needed for items 5, 7 and 8, and to test the headline check and reviewer link.
- A logged-in developer account (and whether an agent may drive your browser) for item 6.

## Known weak spots

- **HubSpot:** "certification needs 60 installs" could not be verified; the source page now returns 404.
- **LinkedIn:** Matched Audiences gating: one LinkedIn page says "approved developers", another says "contact support". Left as is.
- **Spotify:** the 250k-user bar, organization-only rule and 6-week review rest on one page. Listed under "not confirmed" in the guide.
- **Library difficulty scores** were assigned before the 1 to 5 rubric existed and may differ by 1 point.
- **Checkers are the same kind of model as the writers**, so re-checks catch stale or misread facts, not shared blind spots. No person has verified any claim.
- **The Composio list is a static copy.** It could be read from `composio_managed_auth_schemes` on Composio's toolkits API instead.
- **The live site (Vercel) is not updated** until this branch is merged and deployed.
