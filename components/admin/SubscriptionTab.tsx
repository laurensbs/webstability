"use client";

import * as React from "react";
import { Pause, Play, X as IconX, ArrowUpRight, Coins } from "lucide-react";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { DiscountModal } from "@/components/admin/DiscountModal";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type SubData = {
  plan: "care" | "studio" | "atelier" | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  stripeSubscriptionId: string | null;
  paused: boolean;
};

type Discount = {
  id: string;
  percentOff: number;
  monthsApplied: number | null;
  reason: string;
  createdAt: Date;
  stripeCouponId: string | null;
};

type Strings = {
  noSubscription: string;
  noSubscriptionBody: string;
  currentPlan: string;
  status: string;
  renewsAt: string;
  cancelsAt: string;
  pausedLabel: string;
  changePlan: string;
  pauseTitle: string;
  pauseBody: string;
  pause1: string;
  pause2: string;
  pause3: string;
  resume: string;
  cancelTitle: string;
  cancelBody: string;
  cancelButton: string;
  cancelConfirm: string;
  discountTitle: string;
  discountBody: string;
  discountTrigger: string;
  discountPercent: string;
  discountMonths: string;
  discountForever: string;
  discountReason: string;
  discountReasonPlaceholder: string;
  discountSubmit: string;
  discountCancel: string;
  discountHistoryTitle: string;
  discountHistoryEmpty: string;
  discountForeverLabel: string;
  discountMonthsLabel: string;
};

/**
 * Subscription-tab voor één org. Toont huidig plan + Stripe-status,
 * met knoppen voor upgrade/downgrade, pauze, cancel en discount.
 *
 * Alle mutaties gaan via server-actions — dit component is puur de UI.
 */
export function SubscriptionTab({
  sub,
  discounts,
  changePlan,
  pause,
  resume,
  cancel,
  grantDiscount,
  strings,
  dateFmt,
}: {
  sub: SubData | null;
  discounts: Discount[];
  changePlan: Action;
  pause: Action;
  resume: Action;
  cancel: Action;
  grantDiscount: Action;
  strings: Strings;
  dateFmt: Intl.DateTimeFormat;
}) {
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  if (!sub?.stripeSubscriptionId) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-warm) p-8 text-center">
        <p className="font-serif text-2xl">{strings.noSubscription}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-(--color-muted)">
          {strings.noSubscriptionBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header — current plan */}
      <header className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.08em] text-(--color-muted)">
              {strings.currentPlan}
            </p>
            <p className="mt-1 font-serif text-3xl capitalize">{sub.plan ?? "—"}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[12px] text-(--color-muted)">
              {strings.status}: <span className="text-(--color-text)">{sub.status ?? "—"}</span>
              {sub.paused ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-(--color-wine)/10 px-2 py-0.5 text-[11px] font-medium text-(--color-wine)">
                  {strings.pausedLabel}
                </span>
              ) : null}
            </p>
            {sub.cancelAt ? (
              <p className="text-[12px] text-(--color-accent)">
                {strings.cancelsAt}: {dateFmt.format(sub.cancelAt)}
              </p>
            ) : sub.currentPeriodEnd ? (
              <p className="text-[12px] text-(--color-muted)">
                {strings.renewsAt}: {dateFmt.format(sub.currentPeriodEnd)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Plan-change row */}
        <div className="mt-6 border-t border-(--color-border) pt-5">
          <ToastForm action={changePlan} className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-(--color-muted)">
                {strings.changePlan}
              </span>
              <select
                name="plan"
                defaultValue={sub.plan ?? "care"}
                className="block min-h-11 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
              >
                <option value="care">Care · €95/m</option>
                <option value="studio">Studio · €179/m</option>
                <option value="atelier">Atelier · €399/m</option>
              </select>
            </label>
            <ToastSubmitButton variant="primary">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {strings.changePlan}
            </ToastSubmitButton>
          </ToastForm>
        </div>
      </header>

      {/* Pauze + Cancel grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pauze */}
        <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
          <h3 className="inline-flex items-center gap-2 text-[14px] font-medium">
            <Pause className="h-3.5 w-3.5 text-(--color-muted)" />
            {strings.pauseTitle}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-(--color-muted)">
            {strings.pauseBody}
          </p>
          {sub.paused ? (
            <ToastForm action={resume} className="mt-4">
              <ToastSubmitButton variant="primary">
                <Play className="h-3.5 w-3.5" />
                {strings.resume}
              </ToastSubmitButton>
            </ToastForm>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {[1, 2, 3].map((m) => (
                <ToastForm key={m} action={pause}>
                  <input type="hidden" name="months" value={m} />
                  <ToastSubmitButton variant="ghost" className="text-(--color-muted)">
                    {m === 1 ? strings.pause1 : m === 2 ? strings.pause2 : strings.pause3}
                  </ToastSubmitButton>
                </ToastForm>
              ))}
            </div>
          )}
        </article>

        {/* Cancel */}
        <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
          <h3 className="inline-flex items-center gap-2 text-[14px] font-medium">
            <IconX className="h-3.5 w-3.5 text-(--color-muted)" />
            {strings.cancelTitle}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-(--color-muted)">
            {strings.cancelBody}
          </p>
          {confirmCancel ? (
            <div className="mt-4 flex items-center gap-2">
              <ToastForm action={cancel}>
                <ToastSubmitButton variant="primary" className="bg-(--color-wine) text-white">
                  {strings.cancelConfirm}
                </ToastSubmitButton>
              </ToastForm>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="text-[12px] text-(--color-muted) underline-offset-4 hover:underline"
              >
                {strings.discountCancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-[13px] font-medium text-(--color-muted) hover:border-(--color-wine)/40 hover:text-(--color-wine)"
            >
              {strings.cancelButton}
            </button>
          )}
        </article>
      </div>

      {/* Discount section */}
      <article className="rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="inline-flex items-center gap-2 font-serif text-xl">
              <Coins className="h-4 w-4 text-(--color-wine)" />
              {strings.discountTitle}
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-(--color-muted)">
              {strings.discountBody}
            </p>
          </div>
          <DiscountModal
            action={grantDiscount}
            strings={{
              triggerLabel: strings.discountTrigger,
              title: strings.discountTitle,
              body: strings.discountBody,
              percentLabel: strings.discountPercent,
              monthsLabel: strings.discountMonths,
              monthsForever: strings.discountForever,
              reasonLabel: strings.discountReason,
              reasonPlaceholder: strings.discountReasonPlaceholder,
              submit: strings.discountSubmit,
              cancel: strings.discountCancel,
            }}
          />
        </header>

        <div className="mt-6 border-t border-(--color-border) pt-5">
          <h4 className="text-[11px] font-medium tracking-[0.08em] text-(--color-muted)">
            {strings.discountHistoryTitle}
          </h4>
          {discounts.length === 0 ? (
            <p className="mt-3 text-[13px] text-(--color-muted)">{strings.discountHistoryEmpty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-(--color-border)">
              {discounts.map((d) => (
                <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] text-(--color-text)">
                      <span className="font-mono font-medium text-(--color-wine)">
                        {d.percentOff}%
                      </span>
                      <span className="ml-2 text-(--color-muted)">·</span>
                      <span className="ml-2">
                        {d.monthsApplied
                          ? strings.discountMonthsLabel.replace("{n}", String(d.monthsApplied))
                          : strings.discountForeverLabel}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-(--color-muted)">{d.reason}</p>
                  </div>
                  <p className="text-[12px] text-(--color-muted)">{dateFmt.format(d.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </div>
  );
}
