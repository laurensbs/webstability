import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { listAllTicketsForKanban } from "@/lib/db/queries/admin";
import { changeTicketStatusDirect } from "@/app/actions/admin";
import { TicketsKanban, type Ticket } from "@/components/admin/TicketsKanban";
import { formatAgeLabel } from "@/lib/format-age";

export default async function AdminTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.tickets");
  const tKanban = await getTranslations("admin.tickets.kanban");
  const raw = await listAllTicketsForKanban();
  const tickets: Ticket[] = raw.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status,
    category: r.category,
    priority: r.priority,
    overBudget: r.overBudget,
    ageLabel: formatAgeLabel(r.createdAt, {
      days: (n) => tKanban("ageDays", { n }),
      hours: (n) => tKanban("ageHours", { n }),
    }),
    organization: {
      id: r.organization?.id ?? "",
      name: r.organization?.name ?? "—",
      slug: r.organization?.slug ?? "",
    },
    user: r.user ?? { name: null, email: "" },
    replyCount: r.replyCount,
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
      </header>

      <TicketsKanban
        initialTickets={tickets}
        changeStatus={changeTicketStatusDirect}
        strings={{
          columns: {
            open: tKanban("colInbox"),
            in_progress: tKanban("colInProgress"),
            waiting: tKanban("colWaiting"),
            closed: tKanban("colClosed"),
          },
          emptyColumn: tKanban("emptyColumn"),
          noOrg: tKanban("noOrg"),
          filterAll: tKanban("filterAll"),
          filterCategory: tKanban("filterCategory"),
          filterPriority: tKanban("filterPriority"),
        }}
      />
    </div>
  );
}
