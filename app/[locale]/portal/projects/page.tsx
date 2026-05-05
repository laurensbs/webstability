import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgProjects } from "@/lib/db/queries/portal";

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
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      {list.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium">{p.name}</h2>
                <span className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                  {t(`type.${p.type}`)}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                {t(`status.${p.status}`)}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-(--color-muted)">
                  <span>{t("progress")}</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-(--color-bg-warm)">
                  <div
                    className="h-full rounded-full bg-(--color-accent)"
                    style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
