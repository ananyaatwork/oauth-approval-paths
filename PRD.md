# OAuth Guide Library — Take-Home Plan (6–8 hr budget)

## Original assignment

> **Problem.** A developer building an AI agent wants their users to connect an app. Before they can launch, they may need to create an OAuth app with the provider and get it approved. Today, developers piece together documentation, work through unfamiliar setup flows, and email providers to understand the requirements. It can be hard to tell whether setup will take an hour or involve weeks of waiting, how much work is needed, or what might block approval. **Help developers understand that path and make progress on it.** They should be able to look up an app, get a guide they can use and share, and know what to do next.
>
> **Assignment.** Build a working experience that gives developers and agent builders clear, actionable guidance for setting up an OAuth app and getting it approved. A developer should know where to start, what to do next, how much time and effort to expect, and how to proceed when they hit a blocker. The goal is a library of ready-to-use guides for 100 apps that support OAuth. A developer should also be able to submit the name or website of an app they are interested in. An agent should investigate that app and generate a shareable guide in real time, including for apps outside the existing library. For this take-home, demonstrate a few varied apps and this live generation flow. You do not need to produce all 100 guides.
>
> A developer using your result should understand: how easy or difficult it is to get their OAuth app ready for use; the likely time and effort involved, including any wait for approval; the requirements and nuances that could affect their setup; what an agent can do for them and where they need to take over.
>
> Use agents to investigate and attempt as much of the setup process as practical. Let what they discover shape the guidance. Be clear about what you tested, what sources support, and what remains uncertain.
>
> **Grading criteria:** understanding of the developer's problem, useful guidance, sound judgment about evidence, thoughtful use of agents.
>
> **Deliverables:** a working experience + source repo + short README (setup instructions, key decisions, limitations). No paid accounts, no completed provider approvals needed, no production polish required. Keep credentials out of the submission. Budget: 6–8 hours.

---

## 1. Problem Walkthrough

**The three layers you must keep straight (get this wrong and the whole submission reads as "didn't understand the problem"):**

1. **OAuth app registration** — a developer who wants their product to connect to, say, Slack or Google must first register their *integration itself* as a "client" inside that provider's developer console. This produces a client ID/secret and a declared set of scopes. This is a one-time, developer-to-provider relationship — it exists independent of any end user.
2. **The developer's integration code** — the actual OAuth flow (redirect, consent screen, token exchange, refresh) their product runs using that registered client.
3. **End-user connections** — each individual end user who clicks "Connect Slack" inside the developer's product authorizes *that one OAuth app*, producing a per-user access token. One OAuth app → many end-user connections.

**"Provider approval" / "app review"** sits at layer 1. Many providers won't let an OAuth app serve the public until it passes a review: justify each requested scope, supply a privacy policy/ToS, sometimes a demo video or security questionnaire, sometimes a human reviewer on the provider's side. Before approval, the app is usually stuck in a "development/test" mode — often capped to a handful of authorized users (frequently just the developer's own accounts). This review step is where time estimates blow up: self-serve providers (e.g., GitHub) approve instantly; others (Google sensitive-scope verification, Intuit/QuickBooks, Salesforce) can mean days-to-weeks of waiting, back-and-forth, or rejection cycles.

**Why this is painful today:** there's no standard. Every provider's console, terminology, scope taxonomy, and review bar is different, and a developer usually only does this once per provider — no muscle memory builds up. The documentation is scattered, sometimes stale, and the only way to learn "will this take an hour or three weeks" is to start the flow, hit a wall, and email provider support. That uncertainty is the actual pain: it's not that OAuth is technically hard, it's that *planning around it* is impossible without doing it once yourself.

**What "done" looks like for this assignment:** a developer can look up an app (or type in one that isn't listed) and get back, in under a minute, a guide that tells them: how hard this is, how long it will realistically take including any approval wait, what specific requirements/gotchas apply to *this* provider, which steps an agent already did the legwork on vs. which steps only the developer can do (because they require a business decision, a provider-side human reviewer, or credentials the agent shouldn't touch), and what to do if they get stuck. Critically: the guide has to say *how it knows what it knows* — tested, sourced from docs, or genuinely uncertain. That evidentiary honesty is explicitly graded.

---

## 2. Project Overview (one-pager)

**Problem:** Developers integrating OAuth providers can't tell upfront how much time/effort a given provider's app setup + approval will take, or what will block them — and today the only way to find out is to piece it together manually, provider by provider.

**Target user:** A developer or "agent builder" who needs to connect their product to a third-party OAuth provider and wants a fast, trustworthy read on effort and risk *before* committing engineering time to it — and who may want to hand that read to a teammate or stakeholder (hence "shareable").

**Scope (what you're building):**
- A small web app with three surfaces: a **browsable library** of hand-researched guides for a focused, *deliberately varied* set of real apps (not 100 — the brief says you don't need that); a **live generation flow** where a developer types an app name/URL and an agent researches it in real time and produces a guide in the same structured format; and a **guide detail view** that renders setup steps, approval requirements, time/effort estimates, gotchas, agent-vs-manual breakdown, and sourcing/confidence notes.
- Pick **8–12 pre-built library guides spanning the difficulty spectrum on purpose** — e.g., something self-serve/instant (GitHub OAuth App), something medium with scope-justification friction (Slack), something slow/human-reviewed (Google sensitive-scope verification, or Intuit/QuickBooks), something usage-based/tiered (Stripe Connect), one or two more (Notion, HubSpot, Zoom). The *range* is the point — it's what proves you understand that "OAuth setup" isn't one experience.

**Explicitly OUT of scope (say this in the README, don't apologize for it):**
- Generating all 100 guides.
- Any actual provider approval being completed, or any paid/verified accounts.
- Auth/accounts/multi-tenancy for your own tool.
- Guide editing, versioning, or collaboration features.
- A polished design system — lean and credible beats pretty.
- A formal evaluation harness for agent accuracy beyond a manual spot-check (that spot-check is still required, just manual).
- Generating the developer's actual OAuth *implementation* code — this tool is about the registration/approval path, not writing their SDK integration.

**Why this scope is correct for 6–8 hours:** the brief's own grading criteria are understanding, usefulness, evidentiary judgment, and agent use — not library breadth or production polish, and the brief says so explicitly twice ("you do not need to produce all 100," "you do not need... production-ready"). So the budget should skew toward (a) getting the guide *schema* right, (b) making 2–3 guides genuinely well-researched rather than many guides shallow, and (c) making the live-generation flow transparent and honest when it fails or is uncertain — because the reviewer is explicitly told they'll test it with an app you didn't prepare.

---

## 3. To-Do List (sequenced, 6–8 hrs, agent steps flagged)

### Block A — Research & framing (do not skip; ~60–75 min)
- [ ] **(Research)** Look at the managed OAuth app directory the brief points to (likely something like Nango's or a similar public OAuth-integrations catalog) — it already documents many providers' quirks and will save you re-deriving facts. ~15 min
- [ ] **(Research, agent-assisted)** Pick 3–4 real providers across the difficulty spectrum and actually read their developer docs / app-registration + review pages firsthand (or dispatch a research subagent to fetch and summarize them). Take raw notes on: steps to register, what the review process actually asks for, any stated timelines, known gotchas. This is also effectively your dry-run of the live-gen agent's job. ~30 min
- [ ] Define the **guide schema** from what you just learned — the fixed set of fields every guide must have (see PRD §"Guide quality" below). Lock this before building UI. ~15 min
- [ ] Lock the list of 8–12 apps for the pre-built library (deliberately spanning easy/medium/hard/slow) and 2–3 "surprise" apps you'll use only to test the live-gen flow yourself. ~10 min

### Block B — Build (~2.5–3 hrs)
- [ ] Scaffold the web app: library list view, guide detail view, "generate a guide" view.
- [ ] Implement the guide schema as a typed content model.
- [ ] **(Agent-assisted)** For each pre-built library guide: have a research/browsing subagent pull the provider's actual docs, draft the guide fields, then you review and correct it against the primary source. This *is* the "use agents to investigate" requirement — do it for real, don't hand-write these from memory.
- [ ] **(Agent-core feature)** Build the live generation flow: given an app name/URL, the agent searches for the provider's developer docs and OAuth/app-review policy, extracts registration steps + scopes + approval requirements + any stated timelines, fills the schema, and returns a guide *plus* a visible "sources checked / what's confirmed vs. inferred" trail.
- [ ] Give every guide (pre-built or generated) a stable, shareable URL.

### Block C — Verification pass (explicitly graded; don't let Block B eat this time; ~45–60 min)
- [ ] For each hand-built guide, spot-check 2–3 specific claims against the primary source and correct anything the agent got wrong or overstated.
- [ ] **(Agent)** Run the live-gen flow against your 2–3 "surprise" apps (ones you didn't script for) to confirm it behaves sanely and doesn't fabricate confidently when it can't find something — this is a rehearsal of the reviewer's own test.
- [ ] Write the "what we tested / what's unverified" disclosure as a visible part of each guide, not just a paragraph buried in the README.

### Block D — Polish & packaging (~45–60 min)
- [ ] Minimal UI pass: difficulty/time badges on the library, clean guide detail layout, and visible "agent is researching..." step transparency on the generate flow (see stand-out ideas).
- [ ] Write the README: setup instructions, key decisions, what's verified vs. not, limitations, time actually spent. Confirm no credentials/secrets are anywhere in the repo.
- [ ] Full dry run as the reviewer would do it: browse library → open 2 guides → submit an app you haven't tried → confirm it completes end to end.
- [ ] Buffer / optional screen capture if time remains, in case live demo access is flaky at review time.

**Buffer:** ~30 min reserve for whichever block overruns — most likely Block B's agent flow.

---

## 4. PRD

**Problem statement:** Developers can't tell, before they start, how much time and effort a given OAuth provider's app setup-and-approval will take, or what specifically will block them — and the only way to find out today is manual trial, scattered docs, and emailing provider support.

**Target user:** A developer or agent-builder who needs to connect their product to a third-party OAuth provider and wants a fast, trustworthy, shareable read on the path before committing time to it.

**Goals**
- Give a correct, evidence-backed read on difficulty, time/effort (including approval wait), requirements, and blockers for a specific provider.
- Make clear what an agent already did vs. what the developer must personally do.
- Work live, on demand, for an app that isn't pre-built — and be honest when it can't find enough to be confident.

**Non-goals**
- Completing real OAuth approvals, producing all 100 guides, building a production-grade app, generating the developer's integration code, or building accounts/auth for this tool itself.

**Core user flows**
1. **Browse the library** — list of apps with at-a-glance difficulty + time-estimate badges; filter/search by name.
2. **Search/generate for an unlisted app** — enter a name or URL → agent investigates live → structured guide renders, with a visible research trace, in real time (this is explicitly what will be demoed to the reviewer, including with an app they pick).
3. **View a guide** — fixed structure (below), rendered so skimming gets the headline (difficulty, time, next action) in seconds, with detail available on demand.
4. **Hit a blocker / escalation path** — every guide ends with a concrete "if this doesn't work" section: what to try next, where to contact the provider, and what information to have ready when you do.

**What "guide quality" means (the schema, lock this early):**
- *Setup steps* — ordered, concrete, numbered.
- *Approval/review requirements* — what the provider actually asks for to go from dev/test to production, and any human-review step.
- *Time & effort estimate* — given as a **range, broken into phases** (setup / submission / provider review wait / revision cycles), not one number — because "an hour vs. weeks" is the exact uncertainty the brief names.
- *Requirements & nuances* — scope justifications, business verification, domain ownership proof, etc. — whatever is specific to that provider.
- *Agent-assisted vs. manual steps* — explicitly split: what an agent can do (fetch docs, pre-fill forms, draft justifications) vs. what only the developer can do (make business decisions, click through a provider console with their own credentials, respond to a human reviewer).
- *Blockers & escalation path* — what to do, and who to contact, when stuck.
- *Sourcing & confidence notes* — per guide (or per section): confirmed-from-primary-source / inferred-from-secondary-source / unconfirmed. This is not optional — it's one of the four graded dimensions.

**Success criteria for take-home review** — mapped directly to the four stated rubric items:
- *Understanding the developer's problem* → the three-layer distinction (app registration / integration / end-user connection) and the review-vs-launch distinction are visibly correct in the product copy, not just this PRD.
- *Useful guidance* → a developer could act on a guide without you in the room: it answers "where do I start, how long will this take, what will block me, what do I do next."
- *Sound judgment about evidence* → every guide visibly discloses what was checked against a primary source vs. inferred vs. unknown; the live-gen flow degrades gracefully (says "couldn't confirm X") rather than fabricating confidence on an unfamiliar app.
- *Thoughtful use of agents* → agents did real investigative work (visible trace, not canned text), and the product is explicit about where agent work stops and human judgment/action begins.

**Suggested lean tech approach (scoping, not architecting):** a simple web app (any framework you're already fast in) with a small content store for the pre-built guides (flat files/JSON matching the schema are enough — no need for a database), and a single agent-backed endpoint for live generation that does web research, extracts into the same schema, and streams back a visible step trace. No auth, no multi-tenancy, no persistence layer beyond saving generated guides so their links stay live. A senior engineer can make all the implementation calls here — the only hard requirement from the product side is that the schema and the "what was verified" trail are first-class, not bolted on.

---

## Also flagging

**Scope traps to avoid (these are the ones a less disciplined candidate falls into):**
- Burning hours trying to reach 100 guides, or chasing provider breadth over guide depth — the brief tells you twice not to.
- Attempting any real provider approval or using paid/verified accounts — explicitly disallowed by the budget note, and a time sink with no payoff.
- Building login/accounts for your own tool — not asked for, costs an hour you don't have.
- Conflating "developer's OAuth app approval" with "end-user's individual consent/login" in your product copy — if these get blurred anywhere in the UI, it signals you didn't actually understand the problem, which is graded criterion #1.

**Things implied but not stated outright:**
- The brief's mention of a "managed OAuth app directory" as a starting point is a deliberate hint — the evaluator likely expects you to have looked at it, and it's a legitimate shortcut to real sourcing rather than reinventing provider research from scratch.
- "Keep credentials out of the submission" is easy to forget once you're deep in Block B testing real provider consoles for research — do a final grep before submitting.
- The live-generation flow *will* be tested live by the reviewer on an app you didn't pick — Block C's dry run against "surprise" apps isn't optional polish, it's rehearsing the actual grading event.

---

## Stand-out ideas (concrete, buildable in-budget)

1. **Visible agent trace during live generation.** Instead of a spinner, stream the actual steps ("checking github.com/.../docs/apps", "found scope list", "no stated review SLA found — flagging as unconfirmed") as they happen. This single UI choice directly demonstrates "thoughtful use of agents" to a reviewer watching live, rather than asking them to trust a black box.
2. **Confidence badges in the product, not just the README.** Tag each guide section (or the guide overall) "Verified against docs" / "Inferred" / "Unconfirmed" right in the UI. This makes "sound judgment about evidence" something the reviewer sees in two seconds, instead of having to go dig through prose.
3. **Phased time estimate, not a single number.** Render time-to-production as setup / submission / provider-review-wait / revisions, visually (a simple segmented bar is enough). This directly answers the brief's own framing of the pain ("hard to tell if it's an hour or weeks").
4. **Explicit "agent did this / you do this" two-column split on every guide.** This is almost verbatim one of the brief's bullets ("what an agent can do for them and where they need to take over") — making it a literal rendered UI element rather than something you have to infer from reading the guide is a cheap, high-signal move.
5. **Deliberately include one genuinely obscure provider in your demo set** with little public documentation, so that when the reviewer tests an unfamiliar app, there's a real chance the agent has to say "couldn't confirm approval timeline, recommend emailing provider support at X" instead of faking confidence. Turning that into a rehearsed, honest moment (rather than hoping it never happens) converts your weakest-looking scenario into your strongest evidence of judgment.

These five are each small, scoped additions to work you're already doing in Blocks B–D — none require new infrastructure, and together they hit all four graded dimensions explicitly rather than hoping the reviewer infers them.
