"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCcw, Activity } from "lucide-react";

type Strings = {
  eyebrow: string;
  title: string;
  body: string;
  metric: { lastRun: string; entered: string; ctaClicks: string };
  refreshAction: string;
  refreshing: string;
  refreshed: string;
  refreshError: string;
  notSeeded: string;
  notSeededHint: string;
};

/**
 * Demo-management surface op /admin. Toont laatste cron-flip + week-
 * counts (demo-logins, CTA-clicks) en biedt één-klik "forceer refresh"-
 * knop die de bestaande cron-handler triggert. Strategie: voorkom dat
 * ik logs moet lezen om te weten of de demo nog ademt.
 */
export function DemoManagementCard({
  hasDemoOrg,
  lastRunAt,
  weeklyEntered,
  weeklyCtaClicks,
  strings,
  refreshAction,
}: {
  hasDemoOrg: boolean;
  lastRunAt: Date | null;
  weeklyEntered: number;
  weeklyCtaClicks: number;
  strings: Strings;
  refreshAction: () => Promise<{ ok: boolean }>;
}) {
  const [submitting, setSubmitting] = React.useState(false);

  const onRefresh = async () => {
    setSubmitting(true);
    try {
      const res = await refreshAction();
      if (res.ok) toast.success(strings.refreshed);
      else toast.error(strings.refreshError);
    } catch {
      toast.error(strings.refreshError);
    } finally {
      setSubmitting(false);
    }
  };

  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="rounded-panel relative overflow-hidden border border-(--color-border) bg-(--color-surface) p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
            <Activity className="h-3 w-3" strokeWidth={2.4} />
            {strings.eyebrow}
          </p>
          <h3 className="mt-2 text-[20px] font-medium text-(--color-text)">{strings.title}</h3>
          <p className="mt-1.5 max-w-[60ch] text-[13px] text-(--color-muted)">{strings.body}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={submitting || !hasDemoOrg}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-bg-warm) px-3 py-1.5 font-mono text-[11px] tracking-wide text-(--color-text) transition-colors hover:border-(--color-accent)/50 disabled:opacity-60"
        >
          <RefreshCcw className={`h-3 w-3 ${submitting ? "animate-spin" : ""}`} strokeWidth={2.2} />
          {submitting ? strings.refreshing : strings.refreshAction}
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-(--color-border) pt-4 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.metric.lastRun}
          </dt>
          <dd className="mt-1 font-mono text-[12px] text-(--color-text)">
            {lastRunAt ? dateFmt.format(lastRunAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.metric.entered}
          </dt>
          <dd className="mt-1 font-serif text-[22px] leading-none text-(--color-text)">
            {weeklyEntered}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.metric.ctaClicks}
          </dt>
          <dd className="mt-1 font-serif text-[22px] leading-none text-(--color-text)">
            {weeklyCtaClicks}
          </dd>
        </div>
      </dl>

      {!hasDemoOrg ? (
        <p className="mt-4 rounded-md border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-3 py-2 font-mono text-[11px] tracking-wide text-(--color-muted)">
          {strings.notSeeded} — {strings.notSeededHint}
        </p>
      ) : null}
    </article>
  );
}
