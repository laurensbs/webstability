import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgProjects } from "@/lib/db/queries/portal";
import { EmptyState } from "@/components/portal/EmptyState";

const STATUS_PILL: Record<string, string> = {
  planning: "bg-(--color-bg-warm) text-(--color-muted)",
  in_progress: "bg-amber-100 text-amber-900",
  review: "bg-(--color-teal)/15 text-(--color-teal)",
  live: "bg-(--color-success)/15 text-(--color-success)",
  done: "bg-(--color-bg-warm) text-(--color-muted)",
};

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal.projects");
  const list = await listOrgProjects(user.organizationId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={FolderKanban} title={t("empty")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const pillClass = STATUS_PILL[p.status] ?? "bg-(--color-bg-warm) text-(--color-muted)";
            const progress = Math.max(0, Math.min(100, p.progress ?? 0));
            return (
              <li
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(31,27,22,0.12)]"
              >
                <span
                  aria-hidden
                  className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 bg-(--color-accent) transition-transform duration-500 ease-out group-hover:scale-y-100"
                />
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-medium">{p.name}</h2>
                  <span className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                    {t(`type.${p.type}`)}
                  </span>
                </div>
                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${pillClass}`}
                >
                  {t(`status.${p.status}`)}
                </span>
                <div className="mt-5">
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    <span>{t("progress")}</span>
                    <span className="tabular-nums">{progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--color-bg-warm)">
                    <div
                      className="h-full bg-(--color-accent) transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
