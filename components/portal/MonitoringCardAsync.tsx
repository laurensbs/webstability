import { listMonitors, type Monitor } from "@/lib/better-stack";
import { MonitoringCard } from "./MonitoringCard";

export async function MonitoringCardAsync({
  title,
  empty,
  viewLabel,
  statusLabels,
}: {
  title: string;
  empty: string;
  viewLabel: string;
  statusLabels: Record<Monitor["status"], string>;
}) {
  let monitors: Monitor[] = [];
  try {
    monitors = await listMonitors();
  } catch {
    monitors = [];
  }
  return (
    <MonitoringCard
      monitors={monitors}
      title={title}
      empty={empty}
      viewLabel={viewLabel}
      statusLabels={statusLabels}
    />
  );
}

export function MonitoringCardSkeleton({ title }: { title: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
      </header>
      <ul className="divide-y divide-(--color-border)">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="h-3 w-40 animate-pulse rounded bg-(--color-border)" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-(--color-border)" />
          </li>
        ))}
      </ul>
    </section>
  );
}
