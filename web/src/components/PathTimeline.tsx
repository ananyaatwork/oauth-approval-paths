import type { Path } from "@/lib/schema";
import { PHASE_OWNER, formatHours, formatPhase, pathSpan, toHours } from "@/lib/time";

const OWNER_STYLE = {
  you: { bg: "bg-you", text: "text-you", label: "You" },
  provider: { bg: "bg-provider", text: "text-provider", label: "Provider review" },
  customer_admin: { bg: "bg-customer", text: "text-customer", label: "Each customer's admin" },
} as const;

function weight(p: Path["timeline"][number]) {
  if (p.max == null && p.min == null) return 2.2;
  const h = toHours(p.max ?? p.min ?? 0, p.unit);
  return 0.7 + Math.log10(1 + h * 2);
}

export function totalLabel(path: Path) {
  const s = pathSpan(path);
  const lo = formatHours(s.min);
  const hi = formatHours(s.max);
  const range = lo === hi ? lo : `${lo} – ${hi}`;
  return s.openEnded ? `${range} + waits with no stated SLA` : range;
}

export function PathTimeline({ path }: { path: Path }) {
  const total = path.timeline.reduce((a, p) => a + weight(p), 0) || 1;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold">{path.name}</h3>
        <p className="text-sm text-muted">
          Difficulty {path.difficulty}/5 · {totalLabel(path)}
        </p>
      </div>
      <p className="mt-0.5 text-sm text-muted">{path.whenThisApplies}</p>
      <div className="mt-3 flex h-3 w-full gap-[3px] overflow-hidden rounded-sm" role="img" aria-label={`Timeline for ${path.name}`}>
        {path.timeline.map((p, i) => {
          const o = OWNER_STYLE[PHASE_OWNER[p.kind]];
          const unknown = p.basis === "no_stated_sla";
          return (
            <div
              key={i}
              style={{ flexGrow: weight(p) / total }}
              className={`${unknown ? "hatch opacity-80" : o.bg} min-w-[6px] basis-0`}
            />
          );
        })}
      </div>
      <ol className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {path.timeline.map((p, i) => {
          const o = OWNER_STYLE[PHASE_OWNER[p.kind]];
          return (
            <li key={i} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${p.basis === "no_stated_sla" ? "hatch" : o.bg}`} />
              <span>
                <span className="font-medium">{p.label}</span>{" "}
                <span className="text-muted">— {formatPhase(p)}</span>
                <span className={`block text-xs ${o.text}`}>{o.label}</span>
                {p.note && <span className="block text-xs text-muted">{p.note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
