import { Activity } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Monitor } from "@/lib/better-stack";

const DOT_COLOR: Record<Monitor["status"], string> = {
  up: "bg-(--color-success)",
  down: "bg-(--color-wine)",
  paused: "bg-(--color-muted)",
  pending: "bg-(--color-muted)",
  maintenance: "bg-(--color-muted)",
  validating: "bg-(--color-muted)",
};

/**
 * Compact uptime card on the dashboard — three or four monitors with a
 * coloured status dot. Uses the same Better Stack `listMonitors()` data
 * that powers the public /status page, so this stays accurate without a
 * separate fetch.
 *
 * If no monitors are configured, the card stays mounted with a single
 * "geen monitors" line so the slot doesn't collapse the grid layout.
 */
export function MonitoringCard({
  monitors,
  title,
  empty,
  viewLabel,
  statusLabels,
}: {
  monitors: Monitor[];
  title: string;
  empty: string;
  viewLabel: string;
  statusLabels: Record<Monitor["status"], string>;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
          <h2 className="text-base font-medium">{title}</h2>
        </div>
        <Link href="/status" className="font-mono text-xs text-(--color-accent)">
          {viewLabel} →
        </Link>
      </header>

      {monitors.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border)">
          {monitors.slice(0, 4).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <p className="min-w-0 flex-1 truncate text-sm">{m.name}</p>
              <span className="flex shrink-0 items-center gap-2">
                <span className={`relative flex h-2 w-2`} aria-hidden>
                  {m.status === "up" ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
                  ) : null}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${DOT_COLOR[m.status]}`}
                  />
                </span>
                <span className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  {statusLabels[m.status]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
