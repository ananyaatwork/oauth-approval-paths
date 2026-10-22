# OAuth Approval Paths

**What it is:** a guide library that tells a developer how long it takes to get an OAuth app approved by a provider, what blocks it, who they wait on, and which parts an agent can do for them. It covers 10 providers, picked because each has a different kind of wait. You can also type in any other app, and an agent researches it live and writes a guide in the same format.

- **Live demo:** https://greenlight-lime-iota.vercel.app
- **Repo:** https://github.com/ananyaatwork/oauth-approval-paths
- **The guides:** `web/src/guides/*.json`, made from the research notes in `research/`, with verification logs in `research/verification/`.

## The problem, as I understood it

Three things get mixed up:

1. **The developer's OAuth app.** It's registered once with the provider and holds the client ID, redirect URLs and scopes. This is what providers review, cap and gate.
2. **The developer's integration code.** The OAuth flow itself. This is the well-documented part.
3. **Each end user's connection.** A consent and token per user. For some providers each *customer's admin* must also approve the app.

What hurts isn't the OAuth flow. It's that you can't plan around layer 1. Docs rarely state review times, the blockers that stop you before you can even submit are scattered, and on GitHub and Microsoft the longest wait sits with each customer's admin, not the provider. Managed OAuth directories such as Composio's tell you *whether* you need your own app. They don't tell you what getting it approved involves. That's the gap this project fills.

## Key decisions

- **Time is the main thing on screen.** The home page sorts the library by time to production on a log axis from minutes to months. Each guide splits the wait into phases coloured by whose time it is: yours, the provider's, or your customer's admin's.
- **"No stated SLA" is a first-class value, not a blank.** GitHub, QuickBooks and Zoom state no review time, and Google's own pages disagree with each other. Unknown waits are hatched and labelled. They're never filled with a guessed number, and where sources disagree the guide shows both figures.
- **Blockers before submission are separate from the review checklist.** Some providers stop you before you can submit at all: Slack needs 10 active workspaces, HubSpot 3 unaffiliated installs, and LinkedIn a legal entity and a Company Page. These get their own section because they're what make "an hour or weeks" so hard to call.
- **Every claim carries evidence.** Each claim is tagged confirmed (the provider's own page), secondary (a blog, forum, vendor or search excerpt) or unconfirmed, and links to its source. Each guide ends with "What we couldn't confirm".
- **Who does what.** Each step is owned by the agent, you, the provider or the customer's admin. The guide renders this as "An agent can do", "You need to do" and "You wait on". Agents can draft scope justifications, privacy policy text, demo scripts and checklists. They can't log into your developer console, verify your domain, pay assessors or answer a reviewer as you.
- **Live research uses one AI call.** Plain code searches the web (Tavily, with Serper as the backup), reads the provider's pages (a direct fetch with Mozilla Readability, with Jina Reader as the backup for JavaScript-only sites), and keeps only the paragraphs about registration, review, limits and timelines. Only then does one model call (Gemini, with a second Gemini model and optionally Claude as backups) turn those excerpts into a guide. That keeps it on free tiers, and if any one provider goes down, the next one takes over.
- **A provenance check runs in code, not in the model.** The model can only cite the numbered sources we hand it. A fact stays "confirmed" only if it cites a provider page we actually opened. Third-party pages and search snippets cap it at "secondary", and the guide says how many facts were downgraded.
- **Each new app is researched once, then saved.** The first request for an app runs the agent. Everyone after that gets the saved guide instantly at `/g/<app>`, so there's no repeat cost and everyone sees the same version. Different spellings ("Linear", "linear.app", "https://linear.app/docs") count as the same app, and a lock stops two people researching the same new app at once.
- **Quota protection.** Each browser gets one live run, counted by a cookie and a browser fingerprint, so clearing cookies or cache doesn't reset it. Both are stored only as salted hashes. A global daily cap (`LIVE_RUNS_PER_DAY`, default 15) is the hard guard on free API quota. Saved guides and the library never count, and a run that fails because of a provider error is refunded.
- **Every guide is shareable.** Each has a stable link and can be copied as Markdown or downloaded as JSON.

## How the guides were made, and what was checked

1. **Research (Claude Opus 5.5, one agent per provider).** Each agent read the provider's developer docs and wrote notes with a URL and confidence tag on every claim (`research/*.md`).
2. **Conversion (one agent per guide).** Each agent mapped its notes into the schema (`web/src/lib/schema.ts`) without adding facts. `npm run validate` checks the schema, that every cited source id exists, and the difficulty ranges.
3. **Independent re-check (Block C).** A separate agent per guide re-opened the live pages for the highest-impact claims in five guides (Google, Slack, Microsoft, Salesforce, Notion) and corrected the JSON. Results are in `research/verification/` and in each guide's "Corrected after a spot-check" list.

_Verification results summary: to be filled in._

Things the research changed versus my starting assumptions:
- **Notion:** I assumed a public integration needs company and privacy details. The current portal doesn't ask for them, and only an outdated third-party page did.
- **Salesforce:** Connected Apps are now off by default, and reaching customer orgs needs a managed package.
- **Microsoft:** since August 2025, new tenants need admin consent for Mail, Files and Calendar scopes, even for verified apps.
- **HubSpot:** OAuth only works straight away in developer test accounts.
- **LinkedIn:** a rejection can cost you the whole app, and Community Management access lapses if you don't reach Standard within 12 months.

## Live research runs (22 Oct 2026)

These ran through the real app with free-tier keys. Gemini's bigger models were overloaded throughout, so the fallback chain was used on two of the three.

| App | Time | Pages read (provider's own) | Written by | Result |
|---|---|---|---|---|
| Linear | 91 s | 6 (6) | gemini-3.5-flash-lite, after 3.6 Flash was overloaded and 3.8 Flash timed out | 2 paths, 11 facts (10 confirmed). It found workspace-admin approval of third-party apps. |
| Dropbox | 47 s | 6 (6) | gemini-3.5-flash-lite, after both bigger models were overloaded | 2 paths, 14 facts (all confirmed). |
| Gusto | 52 s | 6 (6) | gemini-3.6-flash | 2 paths, 25 facts (24 confirmed): sandbox right away, production needs pre-approval plus a security review. |

**Spot-check (Dropbox):** the facts match Dropbox's developer guide. Once an app links 50 users, you have two weeks to get production approval. But the headline oversimplifies: it says "works for up to 50 users", while the cap is 500 and 50 is only where the two-week deadline starts. The lighter fallback model loses nuance like this, which is why live guides say they haven't been checked by a person.

## UI quality gate

The build runs `npm run slop-gate` before `next build` (via `prebuild`). The gate checks the code against "21 signs a website was vibecoded". It fails the build on any of these:
- purple gradients
- glows, or decorative backgrounds on dark
- glass blur
- coloured stripes on cards
- all-caps or monospace labels
- decorative pulsing dots
- numbers written as words
- placeholder images
- unapproved animations
- too many identical cards
- secondary text below 4.5:1 contrast in either theme

A line can opt out only with a `slop-ok: <reason>` comment. The signs that can't be detected in code (long noun titles, overstuffed screens, metaphors explained by labels, demos made of text, proof nobody can check) are printed as a checklist on every run.

Element shapes are adapted from [Uiverse.io](https://uiverse.io) (MIT): the search bar, the segmented route picker, the stat tiles, the checkbox and the progress line.

## Running it

```bash
cd web
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm run validate             # check every library guide
```

Live research needs a search key (`TAVILY_API_KEY` and/or `SERPER_API_KEY`) and a writer key (`GEMINI_API_KEY`). All of these have free tiers, and `web/.env.example` lists every setting. Without them, the library and saved guides still work, and the research page says live research isn't set up.

Deploying to Vercel: import the repo, set the root directory to `web`, and add `ANTHROPIC_API_KEY` as an environment variable. The generation route allows up to 300 seconds.

## Limitations

- **10 guides, not 100.** They were chosen for variety of wait. The same pipeline (research, convert, validate, re-check) scales, but each guide still needs a check.
- **No real provider setup was attempted.** That needs logged-in developer accounts, and the brief says no paid accounts. "Attempted" here means reading and re-reading the docs, not submitting apps.
- **Spot-checks were done by an agent, not a person.** They covered five guides, about five claims each. The other five guides haven't been re-checked and say so.
- **Live guides are unreviewed.** They depend on what's public. Providers with gated partner portals (e.g. Gusto) will mostly come back "unconfirmed", which is intended.
- **Some figures are estimates.** Setup durations are marked "estimated". Provider review times are only shown where a provider states them.
- **Provider policies change.** Every guide shows its research date, and rate-limit and consent policies changed several times in 2025â€“26.
- **Storage needs Redis in production.** Locally, saved guides and visitor counts go in `web/.data/`, which git ignores. On Vercel, add the Upstash Redis integration (Vercel's "KV"). The app picks up `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Without it, saved guides only last as long as one server instance.
- **The run limit can be got around.** A cookie plus IP hash stops casual reuse, but someone on a different network with cookies cleared gets another run. A spend cap in the Anthropic console is the real backstop.
