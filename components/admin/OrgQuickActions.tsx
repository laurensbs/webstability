"use client";

import * as React from "react";
import { Mail, ExternalLink, Star } from "lucide-react";
import { ToastForm } from "@/components/portal/ToastForm";
import { useToastFormStatus } from "@/components/portal/ToastForm";
import type { ActionResult } from "@/lib/action-result";

type Strings = {
  mailLabel: string;
  stripeLabel: string;
  vipLabel: string;
  vipActive: string;
};

/**
 * Topbar van de org-detail pagina met quick-actions: mail klant, open
 * Stripe-customer in dashboard, toggle VIP. Geen modaal hokje — alles
 * inline, één klik.
 */
export function OrgQuickActions({
  orgName,
  ownerEmail,
  stripeCustomerId,
  isVip,
  toggleVipAction,
  strings,
}: {
  orgName: string;
  ownerEmail: string | null;
  stripeCustomerId: string | null;
  isVip: boolean;
  toggleVipAction: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  strings: Strings;
}) {
  const subject = encodeURIComponent(`Webstability — ${orgName}`);
  const mailHref = ownerEmail ? `mailto:${ownerEmail}?subject=${subject}` : null;
  const stripeHref = stripeCustomerId
    ? `https://dashboard.stripe.com/customers/${stripeCustomerId}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mailHref ? (
        <a
          href={mailHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[13px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)/40"
        >
          <Mail className="h-3.5 w-3.5" />
          {strings.mailLabel}
        </a>
      ) : null}
      {stripeHref ? (
        <a
          href={stripeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[13px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)/40"
        >
          {strings.stripeLabel}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
      <ToastForm action={toggleVipAction}>
        <VipButton isVip={isVip} strings={strings} />
      </ToastForm>
    </div>
  );
}

function VipButton({ isVip, strings }: { isVip: boolean; strings: Strings }) {
  const { pending } = useToastFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={isVip}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
        isVip
          ? "border-(--color-wine) bg-(--color-wine)/10 text-(--color-wine)"
          : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-wine)/40 hover:text-(--color-wine)"
      }`}
    >
      <Star className="h-3.5 w-3.5" fill={isVip ? "currentColor" : "none"} />
      {isVip ? strings.vipActive : strings.vipLabel}
    </button>
  );
}
