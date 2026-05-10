import { Search, TrendingUp, MousePointer2, Percent, Plug } from "lucide-react";

/**
 * Studio+/Atelier-tier feature-block. Toont vier metrics, lokale
 * ranking-blocks (NL+ES), en de SEO-uren-feed. Bij ontbrekende GSC-
 * koppeling staat er een leeg-state per metric — niet "coming soon",
 * wel een eerlijke "koppel je Search Console om dit te zien".
 *
 * GSC-OAuth zelf zit in `.env.example` als `GSC_OAUTH_*` vars; nog
 * niet geïmplementeerd. Deze component werkt dus altijd in
 * "niet gekoppeld"-modus tot die fase. Strings worden in via props
 * gegeven omdat dit een server-component is via wrap door page.tsx.
 */

type SeoMetrics = {
  avgRanking: number | null;
  impressions30d: number | null;
  clicks30d: number | null;
  ctr30d: number | null; // 0..1
};

type SeoHourEntry = {
  workedOn: Date;
  minutes: number;
  description: string;
};

type Strings = {
  metricsTitle: string;
  metricsEmpty: string;
  metrics: {
    avgRanking: string;
    impressions: string;
    clicks: string;
    ctr: string;
  };
  rankingsTitle: string;
  rankingsEmpty: string;
  hoursTitle: string;
  hoursEmpty: string;
  connectGsc: string;
};

export function SeoOverview({
  metrics,
  hours,
  strings,
  locale,
}: {
  metrics: SeoMetrics;
  hours: SeoHourEntry[];
  strings: Strings;
  locale: string;
}) {
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const numFmt = new Intl.NumberFormat(locale);
  const isConnected =
    metrics.avgRanking !== null || metrics.impressions30d !== null || metrics.clicks30d !== null;

  return (
    <div className="space-y-10">
      {/* Metrics */}
      <section>
        <h2 className="mb-4 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {strings.metricsTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={TrendingUp}
            label={strings.metrics.avgRanking}
            value={metrics.avgRanking !== null ? metrics.avgRanking.toFixed(1) : "—"}
            connected={isConnected}
          />
          <MetricCard
            icon={Search}
            label={strings.metrics.impressions}
            value={metrics.impressions30d !== null ? numFmt.format(metrics.impressions30d) : "—"}
            connected={isConnected}
          />
          <MetricCard
            icon={MousePointer2}
            label={strings.metrics.clicks}
            value={metrics.clicks30d !== null ? numFmt.format(metrics.clicks30d) : "—"}
            connected={isConnected}
          />
          <MetricCard
            icon={Percent}
            label={strings.metrics.ctr}
            value={metrics.ctr30d !== null ? `${(metrics.ctr30d * 100).toFixed(1)}%` : "—"}
            connected={isConnected}
          />
        </div>
        {!isConnected ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-bg-warm) px-3 py-1.5 font-mono text-[11px] tracking-wide text-(--color-muted)">
            <Plug className="h-3 w-3" strokeWidth={2.2} />
            {strings.connectGsc}
          </p>
        ) : null}
      </section>

      {/* SEO-uren feed */}
      <section>
        <h2 className="mb-4 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {strings.hoursTitle}
        </h2>
        {hours.length === 0 ? (
          <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-5 py-6 text-[14px] text-(--color-muted)">
            {strings.hoursEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-surface)">
            {hours.map((h, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-[14px] text-(--color-text)">{h.description}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {dateFmt.format(h.workedOn)}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[12px] text-(--color-accent)">
                  {Math.round(h.minutes / 6) / 10}h
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  connected,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  connected: boolean;
}) {
  return (
    <article
      className={`rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 ${
        connected ? "" : "opacity-70"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-(--color-accent)" strokeWidth={2.2} />
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 font-serif text-[28px] leading-none text-(--color-text)">{value}</p>
    </article>
  );
}
