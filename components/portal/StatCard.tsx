export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
      <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">{label}</p>
      <p className="mt-3 text-3xl font-medium">{value}</p>
      {hint ? <p className="mt-1 text-xs text-(--color-muted)">{hint}</p> : null}
    </div>
  );
}
