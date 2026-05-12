"use client";

import * as React from "react";
import { Check, ListChecks } from "lucide-react";

const STORAGE_KEY = "wb:setup-checklist";

/** De bekende "moet nog geregeld worden"-items. Bewust hard-coded — dit is een
 * geheugensteun, geen config-systeem. Vink af zodra gedaan; de hele kaart
 * verdwijnt als alles aangevinkt is. State leeft in localStorage (per browser). */
const ITEMS: Array<{ id: string; label: string; note?: string }> = [
  { id: "anthropic", label: "ANTHROPIC_API_KEY in Vercel", note: "voor de blog-AI-drafts" },
  { id: "stripe_webhook", label: "Stripe-webhook endpoint live", note: "STRIPE_WEBHOOK_SECRET" },
  {
    id: "stripe_coupon",
    label: "Stripe referral-coupon aangemaakt",
    note: "STRIPE_REFERRAL_COUPON",
  },
  { id: "betterstack", label: "Better Stack monitoring-key", note: "BETTER_STACK_API_KEY" },
  { id: "blob", label: "Vercel Blob token", note: "BLOB_READ_WRITE_TOKEN — bestand-uploads" },
  { id: "cal_webhook", label: "Cal.com webhook-secret", note: "CAL_WEBHOOK_SECRET" },
  { id: "search_console", label: "Search Console OAuth", note: "GSC_OAUTH_* — per-org SEO-data" },
  { id: "webmaster", label: "Bing Webmaster + GBP geclaimd" },
  { id: "mailtester", label: "mail-tester.com score gecheckt", note: "SPF/DKIM/DMARC" },
];

export function SetupChecklist() {
  // Lazy-init leest localStorage al op de eerste client-render. SSR geeft een
  // lege map → tot hydratie toont de kaart alles als "te doen"; geen flash van
  // betekenis (admin-only pagina, snelle hydratie).
  const [done, setDone] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  const completed = ITEMS.filter((i) => done[i.id]).length;
  if (completed === ITEMS.length) return null; // alles geregeld → kaart weg

  return (
    <article className="overflow-hidden rounded-lg border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-3">
        <h2 className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
          <ListChecks className="h-3 w-3" strokeWidth={2.4} />
          {"// nog regelen"}
        </h2>
        <span className="font-mono text-[11px] text-(--color-muted)">
          {completed}/{ITEMS.length}
        </span>
      </header>
      <ul className="divide-y divide-(--color-border)">
        {ITEMS.map((item) => {
          const isDone = !!done[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-3 px-5 py-2.5 text-left transition-colors hover:bg-(--color-bg-warm)/40"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors ${
                    isDone
                      ? "border-(--color-success) bg-(--color-success) text-white"
                      : "border-(--color-border) bg-(--color-surface)"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0">
                  <span
                    className={`text-[13.5px] ${isDone ? "text-(--color-muted) line-through" : "text-(--color-text)"}`}
                  >
                    {item.label}
                  </span>
                  {item.note ? (
                    <span className="ml-2 font-mono text-[10px] text-(--color-muted)">
                      {item.note}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
