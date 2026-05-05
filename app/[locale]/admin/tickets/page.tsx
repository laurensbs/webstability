import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { listAllOpenTickets } from "@/lib/db/queries/admin";
import { updateTicketStatus } from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";

export default async function AdminTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.tickets");
  const tPortal = await getTranslations("portal.tickets");
  const list = await listAllOpenTickets();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      {list.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((tk) => {
            const action = updateTicketStatus.bind(null, tk.id);
            const ticketHref =
              locale === "nl" ? `/portal/tickets/${tk.id}` : `/${locale}/portal/tickets/${tk.id}`;
            return (
              <li
                key={tk.id}
                className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <NextLink
                      href={ticketHref}
                      className="block truncate text-lg font-medium hover:text-(--color-accent)"
                    >
                      {tk.subject}
                    </NextLink>
                    <p className="mt-1 truncate font-mono text-xs text-(--color-muted)">
                      {tk.organization?.name} · {tk.user?.name ?? tk.user?.email} ·{" "}
                      {dateFmt.format(tk.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                    {tPortal(`priority.${tk.priority}`)}
                  </span>
                </div>

                <ToastForm action={action} className="mt-4 flex items-end gap-3">
                  <label className="flex-1 space-y-1">
                    <span className="block text-xs font-medium">{t("status")}</span>
                    <select
                      name="status"
                      defaultValue={tk.status}
                      className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                    >
                      <option value="open">{tPortal("status.open")}</option>
                      <option value="in_progress">{tPortal("status.in_progress")}</option>
                      <option value="waiting">{tPortal("status.waiting")}</option>
                      <option value="closed">{tPortal("status.closed")}</option>
                    </select>
                  </label>
                  <ToastSubmitButton variant="outline" size="md">
                    {t("save")}
                  </ToastSubmitButton>
                </ToastForm>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
