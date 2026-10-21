# Guide schema (v1)

Every guide, whether from the library or generated live, uses this shape, so the UI renders both the same way.

What the four research passes changed:
- **One provider can have several paths.** Google's timeline depends on the scope tier (non-sensitive, sensitive, restricted), so a guide holds `paths[]`, not one timeline.
- **Waits come from three parties:** the provider's review, each customer's admin (GitHub org owners, Microsoft tenant admins), and the developer's own revisions. Each is its own phase.
- **"No stated SLA" is a valid value.** GitHub and QuickBooks state no review time, and Google contradicts itself, so every number carries a `basis` and sources.
- **Some prerequisites block you before you can submit at all:** Slack needs 10 active workspaces and GitHub paid listings need 100 installs. These go in `prerequisites`, separate from the submission checklist.
- **What works before approval matters most for planning:** Google allows 100 test users with 7-day refresh tokens, and QuickBooks gives sandbox keys only. That goes in `beforeApproval`.

```ts
type Confidence = "confirmed" | "secondary" | "unconfirmed";
//  confirmed   = read on the provider's own docs or policy page
//  secondary   = blog, forum, vendor writeup (e.g. Codat, Nango)
//  unconfirmed = inferred or not found; shown with a warning

type Owner = "agent" | "you" | "provider" | "customer_admin";
//  drives the "agent can do / you do / you wait on" split

interface Cited { confidence: Confidence; sources: string[] } // ids into sources[]

interface Phase extends Cited {
  kind: "setup" | "prerequisites" | "submission" | "provider_review" | "revisions" | "customer_admin_approval";
  min: number | null; max: number | null;     // null = unknown
  unit: "minutes" | "hours" | "business_days" | "days" | "weeks";
  basis: "stated" | "estimated" | "no_stated_sla";
  note?: string;
}

interface Path {
  name: string;                  // "Non-sensitive scopes", "Marketplace listing"
  whenThisApplies: string;       // plain-language trigger
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeline: Phase[];
}

interface Step extends Cited {
  title: string; detail: string;
  owner: Owner;
  agentHelp?: string;            // what an agent can prep even if owner = "you"
  url?: string;
}

interface Guide {
  slug: string; name: string; website: string; category: string;
  origin: "library" | "live";
  researchedOn: string;          // ISO date
  model?: string;

  verdict: { difficulty: 1|2|3|4|5; headline: string; nextAction: string };
  appType?: string;              // e.g. "Use a GitHub App, not an OAuth App"
  paths: Path[];

  beforeApproval: (Cited & { item: string })[];   // user caps, token expiry, sandbox-only
  prerequisites: (Cited & { item: string })[];    // gates before you can submit
  steps: Step[];
  submissionChecklist: (Cited & { item: string; detail?: string })[];
  gotchas: (Cited & { title: string; detail: string })[];
  blockers: { symptom: string; whatToDo: string; contact?: string }[];
  escalation: { channels: { label: string; url?: string; note?: string }[]; haveReady: string[] };

  unknowns: string[];            // explicit "we could not confirm"
  sources: { id: string; url: string; title: string; accessed: string; supports: string }[];
  verification?: { checkedOn: string; checkedBy: "human" | "agent"; claimsChecked: number; corrections: string[] };
}
```

Render rules:
- **Headline strip:** difficulty, the fastest-to-slowest time range across paths, and the next action.
- **Timeline bar:** one segmented bar per path. `no_stated_sla` segments are drawn hatched with the label "no stated SLA".
- **Two columns from `steps[].owner`:** "Agent can do" (`agent`) and "You do" (`you`). `provider` and `customer_admin` steps show as waits.
- **Confidence badge on every cited item.** An unconfirmed item is never shown without its badge.
