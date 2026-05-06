import { Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Invoice = {
  id: string;
  number: string;
  amount: number; // cents
  vatAmount: number; // cents
  currency: string;
  status: string;
  createdAt: Date;
};

const STATUS_PILL: Record<string, { pill: string; dot: string }> = {
  draft: { pill: "bg-(--color-bg-warm) text-(--color-muted)", dot: "bg-(--color-muted)" },
  sent: { pill: "bg-(--color-accent-soft) text-(--color-accent)", dot: "bg-(--color-accent)" },
  paid: { pill: "bg-(--color-success)/15 text-(--color-success)", dot: "bg-(--color-success)" },
  overdue: { pill: "bg-red-100 text-red-900", dot: "bg-red-500" },
  void: { pill: "bg-(--color-bg-warm) text-(--color-muted)", dot: "bg-(--color-muted)" },
};

export function RecentInvoices({
  invoices,
  title,
  empty,
  viewAll,
  locale,
  statusLabel,
}: {
  invoices: Invoice[];
  title: string;
  empty: string;
  viewAll: string;
  locale: string;
  statusLabel: (status: string) => string;
}) {
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const moneyFmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
        <Link href="/portal/invoices" className="font-mono text-xs text-(--color-accent)">
          {viewAll} →
        </Link>
      </header>
      {invoices.length === 0 ? (
        <p className="px-5 py-8 text-sm text-(--color-muted)">{empty}</p>
      ) : (
        <ul className="divide-y divide-(--color-border)">
          {invoices.slice(0, 4).map((inv) => {
            const meta = STATUS_PILL[inv.status] ?? STATUS_PILL.draft;
            const total = (inv.amount + inv.vatAmount) / 100;
            return (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-(--color-bg-warm)/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)">
                  <Receipt className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] font-medium">{inv.number}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-(--color-muted)">
                    {dateFmt.format(inv.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <p className="font-serif text-base leading-none tabular-nums">
                    {moneyFmt.format(total)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[9px] tracking-wide uppercase ${meta.pill}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${meta.dot}`} aria-hidden />
                    {statusLabel(inv.status)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
