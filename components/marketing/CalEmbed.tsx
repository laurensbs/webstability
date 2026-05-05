"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Lazy: only fetched when the visitor explicitly opts in via the button.
// Keeps cal.com's ~80kb runtime out of the initial bundle and avoids
// loading any third-party tracking before consent.
const Cal = dynamic(() => import("@calcom/embed-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface)">
      <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">loading…</p>
    </div>
  ),
});

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK?.trim();

export function CalEmbed({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false);
  const t = useTranslations("contact");

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

  if (!opened) {
    return (
      <button
        type="button"
        onClick={() => setOpened(true)}
        className="group flex min-h-[480px] w-full flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-(--color-border) bg-(--color-bg-warm)/40 p-12 transition-colors hover:border-(--color-accent) hover:bg-(--color-bg-warm)/70"
      >
        <Calendar className="h-12 w-12 text-(--color-muted) transition-colors group-hover:text-(--color-accent)" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">{t("openCalendar")}</p>
          <p className="text-sm text-(--color-muted)">{t("openCalendarHint")}</p>
        </div>
        <Button variant="accent" size="md" asChild>
          <span>{t("openCalendarButton")}</span>
        </Button>
      </button>
    );
  }

  return (
    <Cal
      calLink={CAL_LINK}
      style={{ width: "100%", height: "100%", minHeight: 640 }}
      config={{
        layout: "month_view",
        theme: "light",
        ...(locale ? { locale } : {}),
      }}
    />
  );
}
