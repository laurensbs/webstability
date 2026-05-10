import { Link } from "@/i18n/navigation";

type Project = {
  id: string;
  name: string;
  status: string;
  type: string;
  progress: number | null;
};

const STATUS_PILL: Record<string, string> = {
  planning: "bg-(--color-bg-warm) text-(--color-muted)",
  in_progress: "bg-amber-100 text-amber-900",
  review: "bg-(--color-teal)/15 text-(--color-teal)",
  live: "bg-(--color-success)/15 text-(--color-success)",
  done: "bg-(--color-bg-warm) text-(--color-muted)",
};

export function RecentProjects({
  projects,
  title,
  empty,
  viewAll,
  statusLabel,
}: {
  projects: Project[];
  title: string;
  empty: string;
  viewAll: string;
  statusLabel: (status: string) => string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
        <Link href="/portal/projects" className="font-mono text-xs text-(--color-accent)">
          {viewAll} →
        </Link>
      </header>
      {projects.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border)">
          {projects.slice(0, 5).map((p) => {
            const pillClass = STATUS_PILL[p.status] ?? "bg-(--color-bg-warm) text-(--color-muted)";
            const progress = Math.max(0, Math.min(100, p.progress ?? 0));
            return (
              <li key={p.id}>
                <Link
                  href={{
                    pathname: "/portal/projects/[id]" as never,
                    params: { id: p.id },
                  }}
                  className="block px-5 py-4 transition-colors hover:bg-(--color-bg-warm)/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${pillClass}`}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-(--color-border)">
                      <div
                        className="h-full bg-(--color-accent) transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-(--color-muted) tabular-nums">
                      {progress}%
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
