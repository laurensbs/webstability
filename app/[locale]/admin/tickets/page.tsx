import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { listAllTicketsForKanban } from "@/lib/db/queries/admin";
import { changeTicketStatusDirect } from "@/app/actions/admin";
import { TicketsKanban, type Ticket } from "@/components/admin/TicketsKanban";
import { TicketInbox } from "@/components/admin/TicketInbox";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatAgeLabel } from "@/lib/format-age";

export default async function AdminTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { view } = await searchParams;
  const inboxMode = view === "inbox";

  const t = await getTranslations("admin.tickets");
  const tKanban = await getTranslations("admin.tickets.kanban");
  const tInbox = await getTranslations("admin.tickets.inbox");
  const tRaw = await getTranslations();
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
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          /* View-toggle: kanban (drag-drop) vs inbox (sneltoetsen) */
          <div className="inline-flex rounded-full border border-(--color-border) bg-(--color-surface) p-1 font-mono text-[11px] tracking-wide">
            <Link
              href={{ pathname: "/admin/tickets" }}
              className={`rounded-full px-3 py-1 transition-colors ${
                !inboxMode
                  ? "bg-(--color-text) text-(--color-bg)"
                  : "text-(--color-muted) hover:text-(--color-text)"
              }`}
            >
              {tInbox("viewKanban")}
            </Link>
            <Link
              href={{ pathname: "/admin/tickets", query: { view: "inbox" } }}
              className={`rounded-full px-3 py-1 transition-colors ${
                inboxMode
                  ? "bg-(--color-text) text-(--color-bg)"
                  : "text-(--color-muted) hover:text-(--color-text)"
              }`}
            >
              {tInbox("viewInbox")}
            </Link>
          </div>
        }
      />

      {inboxMode ? (
        <TicketInbox
          initialTickets={tickets}
          changeStatus={changeTicketStatusDirect}
          strings={{
            filters: {
              all: tInbox("filterAll"),
              open: tKanban("colInbox"),
              in_progress: tKanban("colInProgress"),
              waiting: tKanban("colWaiting"),
              closed: tKanban("colClosed"),
            },
            searchPlaceholder: tInbox("searchPlaceholder"),
            emptyList: tInbox("emptyList"),
            selectPrompt: tInbox("selectPrompt"),
            shortcutHint: tInbox("shortcutHint"),
            shortcutsTitle: tInbox("shortcutsTitle"),
            shortcuts: tRaw.raw("admin.tickets.inbox.shortcuts") as Array<{
              keys: string;
              label: string;
            }>,
            resolved: tInbox("resolved"),
            reopened: tInbox("reopened"),
            noOrg: tKanban("noOrg"),
          }}
        />
      ) : (
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
      )}
    </div>
  );
}
