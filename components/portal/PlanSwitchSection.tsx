"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeMyPlan } from "@/app/actions/billing";

type TierId = "care" | "studio" | "atelier";

const TIER_RANK: Record<TierId, number> = { care: 0, studio: 1, atelier: 2 };

type Strings = {
  title: string;
  lede: string;
  currentLabel: string;
  upgradeLabel: string; // "Wissel naar {name} — direct"
  downgradeLabel: string; // "Wissel naar {name} — per volgende factuur"
  confirmUpgrade: string; // "Direct overstappen naar {name}? Pro-rata wordt verrekend."
  confirmDowngrade: string; // "Overstappen naar {name}? Gaat in op je volgende factuur."
  savedToast: string;
  scheduledToast: string;
  errorToast: string;
  switching: string;
};

/**
 * Self-serve plan-switch — drie tier-kaarten met het huidige plan
 * gemarkeerd. Klik op "wissel naar X" → bevestig-dialog → changeMyPlan
 * server-action. Upgrade is direct (pro-rata), downgrade per volgende
 * factuur.
 *
 * tiers: prijzen + namen worden als prop doorgegeven zodat dit
 * component server-side translations krijgt.
 */
export function PlanSwitchSection({
  currentPlan,
  tiers,
  strings,
}: {
  currentPlan: TierId;
  tiers: Array<{ id: TierId; name: string; price: number; perks: string[] }>;
  strings: Strings;
}) {
  const [pendingTier, setPendingTier] = React.useState<TierId | null>(null);
  const [, startTransition] = React.useTransition();

  const onSwitch = (target: TierId) => {
    const tier = tiers.find((t) => t.id === target);
    if (!tier) return;
    const isUpgrade = TIER_RANK[target] > TIER_RANK[currentPlan];
    const msg = (isUpgrade ? strings.confirmUpgrade : strings.confirmDowngrade).replace(
      "{name}",
      tier.name,
    );
    if (!window.confirm(msg)) return;

    setPendingTier(target);
    const fd = new FormData();
    fd.set("plan", target);
    startTransition(async () => {
      const result = await changeMyPlan(null, fd);
      setPendingTier(null);
      if (result.ok) {
        toast.success(
          result.messageKey === "scheduled" ? strings.scheduledToast : strings.savedToast,
        );
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  return (
    <section className="border-t border-(--color-border) pt-8">
      <h2 className="text-xl font-medium">{strings.title}</h2>
      <p className="mt-1 text-sm text-(--color-muted)">{strings.lede}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentPlan;
          const isUpgrade = TIER_RANK[tier.id] > TIER_RANK[currentPlan];
          const busy = pendingTier === tier.id;
          return (
            <article
              key={tier.id}
              className={[
                "rounded-[14px] border p-5",
                isCurrent
                  ? "border-(--color-accent) bg-(--color-accent)/5"
                  : "border-(--color-border) bg-(--color-surface)",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-serif text-[18px] text-(--color-text)">{tier.name}</p>
                <p className="font-mono text-[12px] text-(--color-muted)">€{tier.price}/m</p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {tier.perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-1.5 text-[12px] leading-[1.4] text-(--color-muted)"
                  >
                    <Check
                      className="mt-0.5 h-3 w-3 shrink-0 text-(--color-success)"
                      strokeWidth={2.4}
                    />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent)/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                    {strings.currentLabel}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSwitch(tier.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[12px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)/50 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {busy
                      ? strings.switching
                      : (isUpgrade ? strings.upgradeLabel : strings.downgradeLabel).replace(
                          "{name}",
                          tier.name,
                        )}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
