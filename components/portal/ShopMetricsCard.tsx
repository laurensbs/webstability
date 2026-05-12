import { ShoppingBag, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * "Bestellingen & omzet"-kaart op het portal-dashboard voor een webshop-
 * klant. Cijfers vult staff handmatig in admin (geen live order-feed) —
 * dit is een rustige maandstand, één rij per maand. Toont de laatste maand
 * + een ↑/↓-vergelijking met de maand ervoor. Pure server-component.
 */
type Metric = {
  periodMonth: Date;
  orders: number;
  revenueCents: number;
  currency: string;
  conversionBps: number | null;
  note: string | null;
};

function delta(
  curr: number,
  prev: number | undefined,
): { pct: number; dir: "up" | "down" | "flat" } | null {
  if (prev === undefined || prev === 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export function ShopMetricsCard({
  metrics,
  locale,
  strings,
}: {
  /** Index 0 = laatste maand, index 1 = de maand ervoor (mag ontbreken). */
  metrics: Metric[];
  locale: string;
  strings: {
    title: string;
    ordersLabel: string;
    revenueLabel: string;
    conversionLabel: string;
    empty: string;
    vsPrev: string; // "vs. {month}"
  };
}) {
  const curr = metrics[0];
  const prev = metrics[1];
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const monthShortFmt = new Intl.DateTimeFormat(locale, { month: "short" });

  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <h2 className="inline-flex items-center gap-2 text-base font-medium">
          <ShoppingBag className="h-4 w-4 text-(--color-accent)" strokeWidth={2.2} />
          {strings.title}
        </h2>
        {curr ? (
          <span className="font-mono text-[11px] tracking-wide text-(--color-muted)">
            {monthFmt.format(new Date(curr.periodMonth))}
          </span>
        ) : null}
      </header>

      {!curr ? (
        <p className="px-5 py-6 text-[14px] text-(--color-muted)">{strings.empty}</p>
      ) : (
        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat
              label={strings.ordersLabel}
              value={new Intl.NumberFormat(locale).format(curr.orders)}
              delta={delta(curr.orders, prev?.orders)}
            />
            <Stat
              label={strings.revenueLabel}
              value={new Intl.NumberFormat(locale, {
                style: "currency",
                currency: curr.currency || "EUR",
                maximumFractionDigits: 0,
              }).format(curr.revenueCents / 100)}
              delta={delta(curr.revenueCents, prev?.revenueCents)}
            />
            {curr.conversionBps != null ? (
              <Stat
                label={strings.conversionLabel}
                value={`${(curr.conversionBps / 100).toFixed(2).replace(".", ",")}%`}
                delta={delta(curr.conversionBps, prev?.conversionBps ?? undefined)}
              />
            ) : null}
          </div>
          {prev ? (
            <p className="font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
              {strings.vsPrev.replace("{month}", monthShortFmt.format(new Date(prev.periodMonth)))}
            </p>
          ) : null}
          {curr.note ? (
            <p className="rounded-md border border-(--color-border) bg-(--color-bg-warm)/50 px-3 py-2 text-[13px] leading-[1.5] text-(--color-text)">
              {curr.note}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: { pct: number; dir: "up" | "down" | "flat" } | null;
}) {
  const Icon = delta?.dir === "up" ? TrendingUp : delta?.dir === "down" ? TrendingDown : Minus;
  const color =
    delta?.dir === "up"
      ? "text-(--color-success)"
      : delta?.dir === "down"
        ? "text-(--color-wine)"
        : "text-(--color-muted)";
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {label}
      </p>
      <p className="mt-1 text-[20px] leading-tight font-medium tabular-nums">{value}</p>
      {delta ? (
        <p className={`mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] ${color}`}>
          <Icon className="h-3 w-3" strokeWidth={2.4} />
          {delta.pct}%
        </p>
      ) : null}
    </div>
  );
}
