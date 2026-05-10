import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type StaleProject = {
  projectId: string;
  orgId: string;
  orgName: string;
  projectName: string;
  lastUpdateAt: Date | null;
};

/**
 * Toont actieve build-projecten waarvan de laatste staff-update >7d
 * geleden is (of nooit geweest). Strategie: voorkom stilte richting
 * de klant — als deze widget niet leeg is heb je deze week werk te
 * doen.
 */
export function StaleProjectsWidget({
  projects,
  locale,
}: {
  projects: StaleProject[];
  locale: string;
}) {
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  return (
    <article
      className={`rounded-2xl border p-6 ${
        projects.length > 0
          ? "border-(--color-wine)/30 bg-(--color-wine)/5"
          : "border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <header className="mb-3 flex items-center gap-2">
        <AlertCircle
          className={`h-3.5 w-3.5 ${
            projects.length > 0 ? "text-(--color-wine)" : "text-(--color-success)"
          }`}
          strokeWidth={2.4}
        />
        <h2 className="font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
          Klanten zonder update (7d)
        </h2>
        {projects.length > 0 ? (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-wine) px-1.5 font-mono text-[10px] font-medium text-white">
            {projects.length}
          </span>
        ) : null}
      </header>

      {projects.length === 0 ? (
        <p className="text-[14px] text-(--color-muted)">
          Alle actieve klanten hebben recent updates gehad. Mooi werk.
        </p>
      ) : (
        <ul className="divide-y divide-(--color-border)/50">
          {projects.map((p) => (
            <li
              key={p.projectId}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={{
                    pathname: "/admin/orgs/[orgId]",
                    params: { orgId: p.orgId },
                  }}
                  className="block truncate text-[14px] font-medium text-(--color-text) transition-colors hover:text-(--color-accent)"
                >
                  {p.orgName}
                </Link>
                <p className="mt-0.5 truncate font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                  {p.projectName} ·{" "}
                  {p.lastUpdateAt ? `laatste: ${dateFmt.format(p.lastUpdateAt)}` : "geen updates"}
                </p>
              </div>
              <Link
                href={{
                  pathname: "/admin/orgs/[orgId]",
                  params: { orgId: p.orgId },
                }}
                className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase hover:underline"
              >
                update
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
