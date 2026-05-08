import { listMonitors, type Monitor } from "@/lib/better-stack";
import { Shimmer } from "@/components/animate/Shimmer";
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
  // Vier rows met variërende stripe-breedtes (40/52/36/48ch) zodat het
  // skeleton iets meer "echte content"-vibe heeft dan vier identieke
  // bars. Shimmer-sweep ipv platte animate-pulse.
  const widths = ["10rem", "13rem", "9rem", "12rem"];
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
      </header>
      <ul className="divide-y divide-(--color-border)">
        {widths.map((w, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
            <Shimmer width={w} height={12} rounded="md" />
            <Shimmer width={8} height={8} rounded="full" />
          </li>
        ))}
      </ul>
    </section>
  );
}
