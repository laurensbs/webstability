import NextLink from "next/link";
import { Link } from "@/i18n/navigation";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  user?: { name: string | null; email: string } | null;
};

const PRIORITY_BAR: Record<string, string> = {
  high: "bg-(--color-accent)",
  normal: "bg-(--color-text-soft, #8B8378)",
  low: "bg-(--color-muted)",
};

export function RecentTickets({
  tickets,
  title,
  empty,
  viewAll,
  locale,
}: {
  tickets: Ticket[];
  title: string;
  empty: string;
  viewAll: string;
  locale: string;
}) {
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
        <Link href="/portal/tickets" className="font-mono text-xs text-(--color-accent)">
          {viewAll} →
        </Link>
      </header>
      {tickets.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border)">
          {tickets.slice(0, 5).map((tk) => {
            const bar = PRIORITY_BAR[tk.priority] ?? PRIORITY_BAR.normal;
            return (
              <li key={tk.id}>
                <NextLink
                  href={
                    locale === "nl"
                      ? `/portal/tickets/${tk.id}`
                      : `/${locale}/portal/tickets/${tk.id}`
                  }
                  className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)/40"
                >
                  <span className={`mt-1 h-8 w-[3px] shrink-0 rounded-full ${bar}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tk.subject}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-(--color-muted)">
                      {tk.user?.name ?? tk.user?.email ?? "—"} · {fmt.format(tk.createdAt)}
                    </p>
                  </div>
                </NextLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
