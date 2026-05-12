import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { Receipt, Download } from "lucide-react";
import { EmptyState } from "@/components/portal/EmptyState";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgInvoices } from "@/lib/db/queries/portal";

const STATUS_PILL: Record<string, { pill: string; dot: string }> = {
  draft: { pill: "bg-(--color-bg-warm) text-(--color-muted)", dot: "bg-(--color-muted)" },
  sent: { pill: "bg-(--color-accent-soft) text-(--color-accent)", dot: "bg-(--color-accent)" },
  paid: { pill: "bg-(--color-success)/15 text-(--color-success)", dot: "bg-(--color-success)" },
  overdue: { pill: "bg-red-100 text-red-900", dot: "bg-red-500" },
  void: { pill: "bg-(--color-bg-warm) text-(--color-muted)", dot: "bg-(--color-muted)" },
};

export default async function InvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal.invoices");
  const list = await listOrgInvoices(user.organizationId);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const moneyFmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
      </header>

      {list.length === 0 ? (
        <EmptyState icon={Receipt} title={t("empty")} body={t("emptyBody")} />
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {list.map((inv) => {
            const meta = STATUS_PILL[inv.status] ?? STATUS_PILL.draft;
            const total = (inv.amount + inv.vatAmount) / 100;
            return (
              <li
                key={inv.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)/40"
              >
                <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)">
                  <Receipt className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium">{inv.number}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-(--color-muted)">
                    {inv.dueAt ? dateFmt.format(inv.dueAt) : "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="font-serif text-lg leading-none tabular-nums">
                    {moneyFmt.format(total)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${meta.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
                    {t(`status.${inv.status}`)}
                  </span>
                </div>
                {inv.pdfUrl ? (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                  >
                    <Download className="h-3 w-3" />
                    {t("download")}
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
