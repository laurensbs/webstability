import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = false,
}: {
  label: string;
  /** String/number renderen we direct; ReactNode laat caller een
   * FlashCounter/animation injecten. */
  value: ReactNode | string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  accent?: boolean;
}) {
  const trendClass =
    trend?.direction === "up"
      ? "text-(--color-success)"
      : trend?.direction === "down"
        ? "text-(--color-accent)"
        : "text-(--color-muted)";

  const trendArrow = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <div
      className={`group rounded-lg border bg-(--color-surface) p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)] ${
        accent ? "border-(--color-accent)/40" : "border-(--color-border)"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {label}
        </p>
        {Icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-md bg-(--color-accent-soft) text-(--color-accent)">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-serif text-3xl leading-none">{value}</p>
      {trend ? (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs ${trendClass}`}>
          <span>{trendArrow}</span>
          {trend.value}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-(--color-muted)">{hint}</p>
      ) : null}
    </div>
  );
}
