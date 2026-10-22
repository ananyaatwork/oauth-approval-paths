# OAuth Approval Paths

**What it is:** a guide library that tells a developer how long it takes to get an OAuth app approved by a provider, what blocks it, who they wait on, and which parts an agent can do for them. It covers 10 providers, picked because each has a different kind of wait. You can also type in any other app, and an agent researches it live and writes a guide in the same format.

- **Live demo:** _add Vercel URL_
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
- **A provenance check runs in code, not in the model.** During live generation, a claim stays "confirmed" only if it cites a page the agent actually opened in that run. Otherwise it's downgraded, and the guide says how many claims were downgraded.
- **Each new app is researched once, then saved.** The first request for an app runs the agent. Everyone after that gets the saved guide instantly at `/g/<app>`, so there's no repeat cost and everyone sees the same version. Different spellings ("Linear", "linear.app", "https://linear.app/docs") count as the same app, and a lock stops two people researching the same new app at once.
- **One live run per visitor.** Visitors are counted by a cookie and a salted hash of their IP, and raw IPs are never stored. Saved guides and the library never count, and a run that fails because of a server or model error is refunded. The limit is set with `LIVE_RUNS_PER_VISITOR` (`0` means unlimited).
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

## Running it

```bash
cd web
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm run validate             # check every library guide
```

Live generation needs `ANTHROPIC_API_KEY` on the server. It uses `claude-sonnet-5-5` with server-side web search and web fetch, and you can override the model with `LIVE_MODEL`. Without a key, the library works and the research page explains that live generation isn't configured.

Deploying to Vercel: import the repo, set the root directory to `web`, and add `ANTHROPIC_API_KEY` as an environment variable. The generation route allows up to 300 seconds.

## Limitations

- **10 guides, not 100.** They were chosen for variety of wait. The same pipeline (research, convert, validate, re-check) scales, but each guide still needs a check.
- **No real provider setup was attempted.** That needs logged-in developer accounts, and the brief says no paid accounts. "Attempted" here means reading and re-reading the docs, not submitting apps.
- **Spot-checks were done by an agent, not a person.** They covered five guides, about five claims each. The other five guides haven't been re-checked and say so.
- **Live guides are unreviewed.** They depend on what's public. Providers with gated partner portals (e.g. Gusto) will mostly come back "unconfirmed", which is intended.
- **Some figures are estimates.** Setup durations are marked "estimated". Provider review times are only shown where a provider states them.
- **Provider policies change.** Every guide shows its research date, and rate-limit and consent policies changed several times in 2025–26.
- **Local storage only, for now.** Saved guides and visitor counts are kept in `web/.data/` (ignored by git). Vercel doesn't keep files between requests, so deployment needs a durable store behind `web/src/lib/store.ts`.
- **The run limit can be got around.** A cookie plus IP hash stops casual reuse, but someone on a different network with cookies cleared gets another run. A spend cap in the Anthropic console is the real backstop.
