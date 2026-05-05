import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgInvoices } from "@/lib/db/queries/portal";

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
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      {list.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          <table className="w-full text-sm">
            <thead className="bg-(--color-bg-warm)/60 text-left font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              <tr>
                <th className="px-6 py-3">{t("number")}</th>
                <th className="px-6 py-3">{t("amount")}</th>
                <th className="px-6 py-3">{t("due")}</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {list.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-3 font-mono text-xs">{inv.number}</td>
                  <td className="px-6 py-3">
                    {moneyFmt.format((inv.amount + inv.vatAmount) / 100)}
                  </td>
                  <td className="px-6 py-3 text-(--color-muted)">
                    {inv.dueAt ? dateFmt.format(inv.dueAt) : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
                      {t(`status.${inv.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
