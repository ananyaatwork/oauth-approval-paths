const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// "2026-10-21" -> "21 Oct 2026". UTC keeps server and client output identical.
export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
}
