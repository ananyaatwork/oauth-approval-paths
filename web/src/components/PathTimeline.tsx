import type { Path } from "@/lib/schema";
import { PHASE_OWNER, formatHours, formatPhase, pathSpan, toHours } from "@/lib/time";
import { DifficultyDots } from "./DifficultyDots";

export const OWNER_STYLE = {
  you: { bg: "bg-you", text: "text-you", label: "You" },
  provider: { bg: "bg-provider", text: "text-provider", label: "Provider review" },
  customer_admin: { bg: "bg-customer", text: "text-customer", label: "Each customer's admin" },
} as const;

const unknownPhase = (p: Path["timeline"][number]) => p.basis === "no_stated_sla" || (p.max == null && p.min == null);

function weight(p: Path["timeline"][number]) {
  if (p.max == null && p.min == null) return 2.2;
  const h = toHours(p.max ?? p.min ?? 0, p.unit);
  return 0.7 + Math.log10(1 + h * 2);
}

export function totalLabel(path: Path) {
  const s = pathSpan(path);
  const lo = formatHours(s.min);
  const hi = formatHours(s.max);
  const range = lo === hi ? lo : `${lo} to ${hi}`;
  return s.openEnded ? `${range}, plus review time not published` : range;
}

// Phases in order, sized by rough duration, coloured by whose time it is.
export function OwnerBar({ path, className = "h-3" }: { path: Path; className?: string }) {
  const total = path.timeline.reduce((a, p) => a + weight(p), 0) || 1;
  return (
    <div className={`flex w-full gap-[3px] overflow-hidden rounded-sm ${className}`} role="img" aria-label={`Phases for ${path.name}`}>
      {path.timeline.map((p, i) => {
        const o = OWNER_STYLE[PHASE_OWNER[p.kind]];
        return (
          <div
            key={i}
            title={`${p.label}: ${formatPhase(p)}`}
            style={{ flexGrow: weight(p) / total }}
            className={`min-w-[6px] basis-0 ${unknownPhase(p) ? `hatch-owner ${o.text}` : o.bg}`}
          />
        );
      })}
    </div>
  );
}

export function PathTimeline({ path }: { path: Path }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold">{path.name}</h3>
        <p className="flex items-center gap-2 text-sm text-muted">
          <DifficultyDots value={path.difficulty} />
          {totalLabel(path)}
        </p>
      </div>
      <p className="mt-0.5 max-w-[72ch] text-sm text-muted">{path.whenThisApplies}</p>
      <OwnerBar path={path} className="mt-3 h-3" />
      <ol className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {path.timeline.map((p, i) => {
          const o = OWNER_STYLE[PHASE_OWNER[p.kind]];
          return (
            <li key={i} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unknownPhase(p) ? `hatch-owner ${o.text}` : o.bg}`} />
              <span>
                <span className="font-medium">{p.label}</span>{" "}
                <span className="text-muted">({formatPhase(p)})</span>
                <span className={`block text-[13px] ${o.text}`}>{o.label}</span>
                {p.note && <span className="block text-[13px] text-muted">{p.note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
