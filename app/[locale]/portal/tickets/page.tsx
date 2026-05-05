import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgTickets } from "@/lib/db/queries/portal";
import NextLink from "next/link";
import { Button } from "@/components/ui/Button";

export default async function TicketsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal.tickets");
  const list = await listOrgTickets(user.organizationId);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <Button asChild variant="accent">
          <NextLink
            href={locale === "nl" ? "/portal/tickets/new" : `/${locale}/portal/tickets/new`}
          >
            {t("new")}
          </NextLink>
        </Button>
      </header>

      {list.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {list.map((tk) => (
            <li key={tk.id}>
              <a
                href={`/${locale === "nl" ? "" : `${locale}/`}portal/tickets/${tk.id}`}
                className="flex items-center justify-between gap-6 px-6 py-4 transition-colors hover:bg-(--color-bg-warm)"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tk.subject}</p>
                  <p className="mt-1 font-mono text-xs text-(--color-muted)">
                    {dateFmt.format(tk.createdAt)} · {tk.user?.name ?? tk.user?.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                    {t(`priority.${tk.priority}`)}
                  </span>
                  <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
                    {t(`status.${tk.status}`)}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
