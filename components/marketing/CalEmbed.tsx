"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { getCalApi } from "@calcom/embed-react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/animate/Spinner";
import { applyWebstabilityCalBranding } from "@/lib/cal-branding";

// Cal.com embed wordt direct geladen — eerder zat er een opt-in
// klikknop op zodat de runtime pas binnenkwam na expliciete toestemming,
// maar dat voelde traag/flakkerig. Nu verschijnt de kalender meteen,
// met een nette skeleton-state zolang de bundle binnenkomt.
const Cal = dynamic(() => import("@calcom/embed-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] w-full items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface)">
      <span className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        <Spinner size={14} variant="accent" />
        agenda laden…
      </span>
    </div>
  ),
});

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK?.trim();
// Override host for self-hosted / EU instances. Defaults to https://cal.com.
// Example: NEXT_PUBLIC_CAL_ORIGIN="https://cal.eu"
const CAL_ORIGIN = process.env.NEXT_PUBLIC_CAL_ORIGIN?.trim();
const CAL_EMBED_JS = CAL_ORIGIN ? `${CAL_ORIGIN}/embed/embed.js` : undefined;

export function CalEmbed({ locale }: { locale: string }) {
  const t = useTranslations("contact");

  // Webstability-branding op de Cal-iframe (terracotta accent + cream-fond).
  // Eén keer toepassen zodra de Cal-api beschikbaar is; faalt graceful.
  React.useEffect(() => {
    if (!CAL_LINK) return;
    let cancelled = false;
    (async () => {
      try {
        const cal = await getCalApi({ embedJsUrl: CAL_EMBED_JS });
        if (!cancelled) applyWebstabilityCalBranding(cal);
      } catch {
        // default-styling als fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // No Cal.com link configured yet — fall back to a polished mailto card so
  // visitors aren't dumped on a 404. Set NEXT_PUBLIC_CAL_LINK="<slug>" to enable.
  if (!CAL_LINK) {
    return (
      <div className="flex min-h-[480px] w-full flex-col items-center justify-center gap-6 rounded-lg border border-(--color-border) bg-(--color-bg-warm)/40 p-12">
        <Mail className="h-12 w-12 text-(--color-muted)" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">{t("calFallbackTitle")}</p>
          <p className="text-sm text-(--color-muted)">{t("calFallbackHint")}</p>
        </div>
        <Button variant="accent" size="md" asChild>
          <a href="mailto:hello@webstability.eu">hello@webstability.eu</a>
        </Button>
      </div>
    );
  }

  return (
    <Cal
      calLink={CAL_LINK}
      calOrigin={CAL_ORIGIN}
      embedJsUrl={CAL_EMBED_JS}
      style={{ width: "100%", height: "100%", minHeight: 640 }}
      config={{
        layout: "month_view",
        theme: "light",
        ...(locale ? { locale } : {}),
      }}
    />
  );
}
