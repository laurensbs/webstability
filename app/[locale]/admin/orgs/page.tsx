import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { listAllOrgs } from "@/lib/db/queries/admin";

export default async function OrgsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.orgs");
  const orgs = await listAllOrgs();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const newOrgHref = locale === "nl" ? "/admin/orgs/new" : `/${locale}/admin/orgs/new`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <NextLink
          href={newOrgHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)]"
        >
          + {t("newOrg")}
        </NextLink>
      </div>

      {orgs.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {orgs.map((o) => {
            const href = locale === "nl" ? `/admin/orgs/${o.id}` : `/${locale}/admin/orgs/${o.id}`;
            return (
              <li key={o.id}>
                <NextLink
                  href={href}
                  className="flex items-center justify-between gap-6 px-6 py-4 transition-colors hover:bg-(--color-bg-warm)"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.name}</p>
                    <p className="mt-1 truncate font-mono text-xs text-(--color-muted)">
                      {o.country} · {o.plan ?? "no-plan"} · {dateFmt.format(o.createdAt)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 gap-4 font-mono text-xs text-(--color-muted) md:flex">
                    <span>{t("members", { count: Number(o.memberCount) })}</span>
                    <span>{t("projects", { count: Number(o.projectCount) })}</span>
                    {Number(o.openTicketCount) > 0 ? (
                      <span className="text-(--color-accent)">
                        {t("openTickets", { count: Number(o.openTicketCount) })}
                      </span>
                    ) : null}
                  </div>
                </NextLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
