import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import NextLink from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/portal/EmptyState";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgTickets } from "@/lib/db/queries/portal";
import { Button } from "@/components/ui/Button";

const PRIORITY_BAR: Record<string, string> = {
  high: "bg-(--color-accent)",
  normal: "bg-(--color-muted)",
  low: "bg-(--color-border)",
};

const STATUS_PILL: Record<string, string> = {
  open: "bg-(--color-accent-soft) text-(--color-accent)",
  in_progress: "bg-amber-100 text-amber-900",
  waiting: "bg-(--color-teal)/15 text-(--color-teal)",
  closed: "bg-(--color-bg-warm) text-(--color-muted)",
};

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
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const newHref = locale === "nl" ? "/portal/tickets/new" : `/${locale}/portal/tickets/new`;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <Button asChild variant="accent">
          <NextLink href={newHref} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </NextLink>
        </Button>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("empty")} />
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {list.map((tk) => {
            const bar = PRIORITY_BAR[tk.priority] ?? PRIORITY_BAR.normal;
            const pill = STATUS_PILL[tk.status] ?? "bg-(--color-bg-warm) text-(--color-muted)";
            const href =
              locale === "nl" ? `/portal/tickets/${tk.id}` : `/${locale}/portal/tickets/${tk.id}`;
            return (
              <li key={tk.id}>
                <NextLink
                  href={href}
                  className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)/40"
                >
                  <span className={`mt-1 h-10 w-[3px] shrink-0 rounded-full ${bar}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tk.subject}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-(--color-muted)">
                      {dateFmt.format(tk.createdAt)} · {tk.user?.name ?? tk.user?.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${pill}`}
                    >
                      {t(`status.${tk.status}`)}
                    </span>
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
