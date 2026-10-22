export function DifficultyDots({ value, className = "" }: { value: number; className?: string }) {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <span className={`inline-flex items-center gap-[3px] ${className}`} role="img" aria-label={`Difficulty ${v} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= v ? "bg-ink" : "bg-line"}`} />
      ))}
    </span>
  );
}
