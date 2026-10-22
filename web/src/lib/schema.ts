import { z } from "zod";

// Nullable instead of optional throughout: the same schema constrains the
// model's structured output, which requires every property to be present.

export const Confidence = z.enum(["confirmed", "secondary", "unconfirmed"]);
export const Owner = z.enum(["agent", "you", "provider", "customer_admin"]);

const cited = {
  confidence: Confidence,
  sources: z.array(z.string()).describe("ids from the guide's sources[]"),
};

export const Phase = z.object({
  kind: z.enum([
    "setup",
    "prerequisites",
    "submission",
    "provider_review",
    "revisions",
    "customer_admin_approval",
  ]),
  label: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  unit: z.enum(["minutes", "hours", "business_days", "days", "weeks"]),
  basis: z.enum(["stated", "estimated", "no_stated_sla"]),
  note: z.string().nullable(),
  ...cited,
});

export const Path = z.object({
  name: z.string(),
  whenThisApplies: z.string(),
  difficulty: z.number().int().describe("1 (trivial) to 5 (gated / weeks)"),
  timeline: z.array(Phase),
});

export const Step = z.object({
  title: z.string(),
  detail: z.string(),
  owner: Owner,
  agentHelp: z.string().nullable().describe("what an agent can prepare even when a human must act"),
  url: z.string().nullable(),
  ...cited,
});

export const Item = z.object({
  item: z.string(),
  detail: z.string().nullable(),
  ...cited,
});

export const Gotcha = z.object({ title: z.string(), detail: z.string(), ...cited });

export const Source = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  accessed: z.string(),
  supports: z.string(),
  kind: z.enum(["primary", "secondary"]),
});

export const GuideContent = z.object({
  name: z.string(),
  website: z.string(),
  category: z.string(),
  verdict: z.object({
    difficulty: z.number().int(),
    headline: z.string(),
    nextAction: z.string(),
  }),
  appType: z.string().nullable(),
  paths: z.array(Path),
  beforeApproval: z.array(Item),
  prerequisites: z.array(Item),
  steps: z.array(Step),
  submissionChecklist: z.array(Item),
  gotchas: z.array(Gotcha),
  blockers: z.array(
    z.object({ symptom: z.string(), whatToDo: z.string(), contact: z.string().nullable() }),
  ),
  escalation: z.object({
    channels: z.array(z.object({ label: z.string(), url: z.string().nullable(), note: z.string().nullable() })),
    haveReady: z.array(z.string()),
  }),
  unknowns: z.array(z.string()),
  sources: z.array(Source),
});

export const TraceLine = z.object({
  kind: z.enum(["search", "opening", "read", "miss", "note", "warn"]),
  text: z.string(),
  detail: z.string().optional(),
  href: z.string().optional(),
});
export type TraceLine = z.infer<typeof TraceLine>;

export const Guide = GuideContent.extend({
  researchLog: z.array(TraceLine).optional(),
  slug: z.string(),
  origin: z.enum(["library", "live"]),
  researchedOn: z.string(),
  model: z.string().nullable(),
  verification: z
    .object({
      checkedOn: z.string(),
      checkedBy: z.enum(["human", "agent"]),
      claimsChecked: z.number().int(),
      corrections: z.array(z.string()),
    })
    .nullable(),
});

export type Guide = z.infer<typeof Guide>;
export type GuideContent = z.infer<typeof GuideContent>;
export type Phase = z.infer<typeof Phase>;
export type Path = z.infer<typeof Path>;
export type Step = z.infer<typeof Step>;
export type Confidence = z.infer<typeof Confidence>;
