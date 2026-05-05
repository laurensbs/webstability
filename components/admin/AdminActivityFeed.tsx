import { MessageSquare, FolderKanban, Receipt, type LucideIcon } from "lucide-react";

type Event = {
  kind: "ticket" | "project" | "invoice";
  id: string;
  label: string;
  orgName: string;
  at: Date;
};

const KIND_META: Record<Event["kind"], { icon: LucideIcon; bg: string; fg: string }> = {
  ticket: { icon: MessageSquare, bg: "bg-(--color-teal)/15", fg: "text-(--color-teal)" },
  project: { icon: FolderKanban, bg: "bg-(--color-accent-soft)", fg: "text-(--color-accent)" },
  invoice: { icon: Receipt, bg: "bg-(--color-success)/15", fg: "text-(--color-success)" },
};

export function AdminActivityFeed({
  events,
  title,
  empty,
  locale,
}: {
  events: Event[];
  title: string;
  empty: string;
  locale: string;
}) {
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
      </header>
      {events.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{empty}</p>
      ) : (
        <ul className="divide-y divide-dashed divide-(--color-border)">
          {events.map((e) => {
            const meta = KIND_META[e.kind];
            const Icon = meta.icon;
            return (
              <li
                key={`${e.kind}-${e.id}`}
                className="flex items-start gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-(--color-bg-warm)/40"
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.bg} ${meta.fg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-medium">{e.label}</span>{" "}
                    <span className="text-(--color-muted)">— {e.orgName}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-(--color-muted)">
                    {fmt.format(e.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
