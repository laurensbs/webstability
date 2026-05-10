"use client";

import * as React from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { markHandoverItemDone, markProjectLive } from "@/app/actions/admin";

type ItemKey =
  | "deliverables_approved"
  | "domain_coupled"
  | "monitoring_active"
  | "credentials_sent"
  | "maintenance_explained"
  | "invoice_paid";

type Item = {
  key: ItemKey;
  label: string;
  doneAt: Date | null;
  auto: boolean;
  meta?: Record<string, unknown>;
};

type Strings = {
  doneLabel: string;
  pendingLabel: string;
  autoLabel: string;
  markDoneLabel: string;
  markUndoneLabel: string;
  markLiveLabel: string;
  markingLive: string;
  liveLabel: string;
  handoverIncompleteToast: string;
  itemSavedToast: string;
  errorToast: string;
  projectLiveToast: string;
  dateLocale: string;
};

/**
 * Klant ziet read-only ✓ / ◯ per item; staff (isStaff) kan handmatig-
 * vinkbare items togglen en — als allDone — project op live zetten.
 * Auto-items (deliverables, monitoring, factuur) zijn altijd read-only.
 */
export function HandoverChecklist({
  projectId,
  items,
  allDone,
  isStaff,
  projectLive,
  strings,
  dateFmt,
}: {
  projectId: string;
  items: Item[];
  allDone: boolean;
  isStaff: boolean;
  projectLive: boolean;
  strings: Strings;
  dateFmt: (d: Date) => string;
}) {
  const [pendingKey, setPendingKey] = React.useState<ItemKey | null>(null);
  const [livePending, setLivePending] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const toggleItem = (item: Item, nextChecked: boolean) => {
    if (!isStaff || item.auto) return;
    setPendingKey(item.key);
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("itemKey", item.key);
    fd.set("checked", String(nextChecked));
    startTransition(async () => {
      const result = await markHandoverItemDone(null, fd);
      setPendingKey(null);
      if (result.ok) {
        toast.success(strings.itemSavedToast);
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  const onMarkLive = () => {
    setLivePending(true);
    const fd = new FormData();
    fd.set("projectId", projectId);
    startTransition(async () => {
      const result = await markProjectLive(null, fd);
      setLivePending(false);
      if (result.ok) {
        toast.success(strings.projectLiveToast);
      } else if (result.messageKey === "handover_incomplete") {
        toast.error(strings.handoverIncompleteToast);
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  return (
    <section className="space-y-6">
      <ul className="divide-y divide-(--color-border) overflow-hidden rounded-[18px] border border-(--color-border) bg-(--color-surface)">
        {items.map((item) => {
          const done = item.doneAt !== null;
          const isPending = pendingKey === item.key;
          const interactive = isStaff && !item.auto && !projectLive;
          return (
            <li key={item.key} className="flex items-start gap-4 px-5 py-4">
              <button
                type="button"
                disabled={!interactive || isPending}
                onClick={() => toggleItem(item, !done)}
                aria-label={done ? strings.markUndoneLabel : strings.markDoneLabel}
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  done
                    ? "border-(--color-success) bg-(--color-success) text-white"
                    : "border-(--color-border) bg-(--color-bg)",
                  interactive
                    ? "cursor-pointer hover:border-(--color-success)/60"
                    : "cursor-default",
                ].join(" ")}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : null}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-(--color-text)">{item.label}</p>
                <p className="mt-1 inline-flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                  {item.auto ? (
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3" strokeWidth={2.4} />
                      {strings.autoLabel}
                    </span>
                  ) : null}
                  {done && item.doneAt ? (
                    <span className="text-(--color-success)">
                      ✓ {strings.doneLabel} · {dateFmt(item.doneAt)}
                    </span>
                  ) : (
                    <span>{strings.pendingLabel}</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {isStaff && !projectLive ? (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onMarkLive}
            disabled={!allDone || livePending}
            className="inline-flex items-center gap-2 rounded-full bg-(--color-success) px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-(--color-success)/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {livePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            )}
            {livePending ? strings.markingLive : strings.markLiveLabel}
          </button>
        </div>
      ) : null}

      {projectLive ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-(--color-success)/10 px-4 py-2 font-mono text-[11px] tracking-widest text-(--color-success) uppercase">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          {strings.liveLabel}
        </div>
      ) : null}
    </section>
  );
}
