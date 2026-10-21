import type { Path, Phase } from "./schema";

const HOURS: Record<Phase["unit"], number> = {
  minutes: 1 / 60,
  hours: 1,
  days: 24,
  business_days: 24 * (7 / 5),
  weeks: 24 * 7,
};

export const toHours = (n: number, unit: Phase["unit"]) => n * HOURS[unit];

export type Span = { min: number; max: number; openEnded: boolean };

export function pathSpan(path: Path): Span {
  let min = 0;
  let max = 0;
  let openEnded = false;
  for (const p of path.timeline) {
    if (p.basis === "no_stated_sla" || p.max == null) openEnded = true;
    if (p.min != null) min += toHours(p.min, p.unit);
    if (p.max != null) max += toHours(p.max, p.unit);
    else if (p.min != null) max += toHours(p.min, p.unit);
  }
  return { min, max: Math.max(min, max), openEnded };
}

export function guideSpan(paths: Path[]): Span {
  const spans = paths.map(pathSpan);
  if (!spans.length) return { min: 0, max: 0, openEnded: true };
  return {
    min: Math.min(...spans.map((s) => s.min)),
    max: Math.max(...spans.map((s) => s.max)),
    openEnded: spans.some((s) => s.openEnded),
  };
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.max(5, Math.round((h * 60) / 5) * 5)} min`;
  if (h < 24) return `${Math.round(h)} h`;
  const d = h / 24;
  if (d < 14) return `${Math.round(d)} d`;
  const w = d / 7;
  if (w < 9) return `${Math.round(w)} wk`;
  return `${Math.round(d / 30)} mo`;
}

const UNIT_LABEL: Record<Phase["unit"], [string, string]> = {
  minutes: ["minute", "minutes"],
  hours: ["hour", "hours"],
  days: ["day", "days"],
  business_days: ["business day", "business days"],
  weeks: ["week", "weeks"],
};

export function formatPhase(p: Phase): string {
  if (p.basis === "no_stated_sla" && p.min == null && p.max == null) return "no stated SLA";
  const [one, many] = UNIT_LABEL[p.unit];
  const lo = p.min;
  const hi = p.max;
  const range = lo != null && hi != null && lo !== hi ? `${lo}–${hi}` : `${hi ?? lo}`;
  const n = hi ?? lo ?? 0;
  const text = `${range} ${n === 1 && lo === hi ? one : many}`;
  if (p.basis === "no_stated_sla") return `${hi == null ? "at least " : ""}${text}, no stated SLA`;
  return p.basis === "estimated" ? `~${text}` : text;
}

// Log scale from 3 minutes to 6 months, for the library chart.
const LO = Math.log10(0.05);
const HI = Math.log10(24 * 180);
export const axisPos = (h: number) => Math.min(1, Math.max(0, (Math.log10(Math.max(h, 0.05)) - LO) / (HI - LO)));
export const AXIS_TICKS: { label: string; h: number }[] = [
  { label: "5 min", h: 1 / 12 },
  { label: "1 hour", h: 1 },
  { label: "1 day", h: 24 },
  { label: "1 week", h: 168 },
  { label: "1 month", h: 720 },
  { label: "6 months", h: 4320 },
];

export const PHASE_OWNER: Record<Phase["kind"], "you" | "provider" | "customer_admin"> = {
  setup: "you",
  prerequisites: "you",
  submission: "you",
  provider_review: "provider",
  revisions: "you",
  customer_admin_approval: "customer_admin",
};
