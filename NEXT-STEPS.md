# Next steps

Where the project stands as of 2026-10-23, and what is left, in the order I'd do it. Work one item at a time and check each before starting the next.

## What this project is (and isn't)

It is a guide library and a live research agent about **registering an OAuth app with a provider and getting it approved**: how long it takes, what blocks you, who you wait on, and what an agent can do for you.

It does **not** perform OAuth, register apps, submit apps for review, or do business verification. Where a guide mentions business verification (LinkedIn's legal entity, PayPal's merchant checks), it is information for the developer.

## The original review (2026-10-22)

This is the list from the first fresh-eyes review of the project, in its original priority order, with where each item stands. The sections below the table give the detail.

| # | Item | Status |
|---|---|---|
| 1 | **The 10 library apps are all on Composio's managed list**, so none show the case where a developer registers and gets approved themselves. Add apps that are not on the list (including payment gateways and a developing-market provider), add a "Composio-managed OAuth" badge to every guide, and say when a managed-app user would still need the guide (own branding, extra scopes, own quota, marketplace listing). | **Partly done.** Badge done (one line, with the detail on hover and on `/method`). 1 of 11 new apps done: Spotify is in the library. 10 left. |
| 2 | **"What we tested" is the thinnest part.** Everything comes from reading docs. Register real apps on 2 to 3 providers and record time taken, fields asked for, and where the console differs from the docs. Add a "tested by us" evidence level above "confirmed from docs". | **Not started.** Needs a logged-in developer account. |
| 3 | **Fix the unfinished and broken README parts.** Placeholder text, garbled dash, setup steps that list the wrong keys, and 5 of 10 guides never re-checked. | **Done.** All four fixed, and all 10 guides are now re-checked (65 facts: 53 matched, 8 corrected, 4 could not be verified). |
| 4 | **The live demo is fragile** for the exact scenario the brief describes: one run per browser, 15 per day shared, a 90-second run, and the weakest fallback model writing the answer. Add a reviewer bypass, pre-warm likely apps, and show progress during the wait. | **Mostly done.** Reviewer link built, with its own daily cap (`REVIEWER_RUNS_PER_DAY`, default 10); the cap logic is tested, the link itself needs `REVIEWER_KEY` set on Vercel. Progress is shown live and survives leaving the page. Pre-warming: Linear and Gusto are saved on the live site. |
| 5 | **Live-guide quality has a known flaw.** The Dropbox headline said "up to 50 users" when the cap is 500. Add a second pass that checks the headline against the facts. | **Done and tested.** Given the real Dropbox headline and Dropbox's page, it flagged that 50 starts a two-week deadline rather than being the cap and rewrote it to 500 (gemini-3.6-flash, 7 s). It runs only when a backup model wrote the guide, and only with time left before the 300 s limit. |
| 6 | **Show what an agent actually did for the developer.** The guide lists drafted scope justifications, privacy text and demo scripts but does not generate any. Add one real generated artifact per guide. | **Not started.** Needs a model key. See "Submission pack" below. |
| 7 | **Rebalance effort.** The UI quality gate takes too much README space for a 6 to 8 hour assignment graded on evidence and agent use. | **Done.** Shortened and moved to the end. |
| 8 | **Smaller things:** define the 1 to 5 difficulty score; add a staleness warning for old guides; say near the top that no person has checked any claim. | **Done.** Rubric in the writer prompt and on `/method`; a library guide shows its age after 30 days, the same age at which a live guide can be researched again; the README verification paragraph says no person checked. |

Added during the session, beyond the original list:

- **Readiness checker** ("Check your app"): not started. See the to-do list.
- **Reconnect info** (how often users must log in again): in the schema, shown in the Blockers section and in the Markdown export. Spotify and new live guides have it; the 10 original guides do not yet.

## Done on this branch

- **Verified the other five guides** (GitHub, QuickBooks, Zoom, HubSpot, LinkedIn). With the first five, 65 facts across all 10 guides were re-checked: 53 matched, 8 corrected, 4 could not be verified. Logs: `research/verification/`.
- **Composio-managed badge** on every guide (`web/src/lib/managed.ts`), from a copy of Composio's list dated 2026-10-22. "Yes", "Partly" (related products from the same company) or "No".
- **Headline check** (`web/src/lib/research/review.ts`): a second narrow model call checks the headline and next action against provider excerpts and rewrites them if a figure isn't supported. Tested on the real Dropbox mistake (see the table).
- **Reviewer link**: set `REVIEWER_KEY`, open `/generate?reviewer=<key>` to skip the per-browser and public daily limits, with its own daily cap.
- **Time guard**: no new writer model is tried after 190 s, and the headline check stops at 240 s, so a slow run fails and is refunded instead of being cut off at Vercel's 300 s limit.
- **Difficulty rubric (1 to 5)** in the writer prompt and on `/method`; **staleness note** on library guides older than 30 days.
- **`reconnect` field** in the schema (how often a user must log in or re-consent). Optional, so the old guides still validate.
- **README fixes**: placeholder filled, garbled dash fixed, setup and deploy keys corrected, verification numbers updated, UI-gate section moved to the end.
- **Spotify guide** written, independently re-checked (8 facts: 7 matched, 1 corrected) and added to the library.

Checks that pass: `tsc --noEmit`, `npm run lint`, `npm run validate`, `npm run slop-gate`.

## To do, in order

1. **Look at Spotify on the live site** and check its "How often users must reconnect" line.
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

## Known weak spots

- **HubSpot:** "certification needs 60 installs" could not be verified; the source page now returns 404.
- **LinkedIn:** Matched Audiences gating: one LinkedIn page says "approved developers", another says "contact support". Left as is.
- **Spotify:** the 250k-user bar, organization-only rule and 6-week review rest on one page. Listed under "not confirmed" in the guide.
- **Library difficulty scores** were assigned before the 1 to 5 rubric existed and may differ by 1 point.
- **Checkers are the same kind of model as the writers**, so re-checks catch stale or misread facts, not shared blind spots. No person has verified any claim.
- **The Composio list is a static copy.** It could be read from `composio_managed_auth_schemes` on Composio's toolkits API instead.
- **The free Gemini quota** is shared by every run. When gemini-3.6-flash's daily quota is used up and the other models are busy, live research fails and refunds the run.
