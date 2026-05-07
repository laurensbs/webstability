"use client";

import { Link } from "@/i18n/navigation";

type Item = {
  id: string;
  name: string;
  slug: string;
  isVip: boolean;
  status: "up" | "degraded" | "down" | "unknown";
};

type Strings = {
  title: string;
  legendUp: string;
  legendDegraded: string;
  legendDown: string;
  legendUnknown: string;
  empty: string;
};

const STATUS_COLOR: Record<Item["status"], string> = {
  up: "bg-(--color-success)",
  degraded: "bg-(--color-accent)",
  down: "bg-(--color-wine)",
  unknown: "bg-(--color-border)",
};

/**
 * Per-org dotje-grid op admin overview. Eén dot per klant; kleur is
 * worst-case status van zijn live-projects (uit de monitoring_checks
 * cron). Hover toont org-naam + status, klik gaat naar /admin/orgs/{id}.
 */
export function StudioStatusStrip({ items, strings }: { items: Item[]; strings: Strings }) {
  if (items.length === 0) {
    return <p className="text-[14px] text-(--color-muted)">{strings.empty}</p>;
  }

  return (
    <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-medium">{strings.title}</h2>
        <ul className="flex flex-wrap items-center gap-3 text-[11px] text-(--color-muted)">
          <Legend color={STATUS_COLOR.up} label={strings.legendUp} />
          <Legend color={STATUS_COLOR.degraded} label={strings.legendDegraded} />
          <Legend color={STATUS_COLOR.down} label={strings.legendDown} />
          <Legend color={STATUS_COLOR.unknown} label={strings.legendUnknown} />
        </ul>
      </header>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={{ pathname: "/admin/orgs/[orgId]", params: { orgId: item.id } }}
            title={`${item.name} · ${item.status}`}
            className="group relative inline-flex h-6 w-6 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-warm) transition-transform hover:scale-110"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[item.status]}`} />
            {item.isVip ? (
              <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-(--color-wine) ring-2 ring-(--color-surface)" />
            ) : null}
          </Link>
        ))}
      </div>
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </li>
  );
}
