"use client";

import dynamic from "next/dynamic";

// Lazy-load: ~80kb embed runtime stays out of the initial bundle.
const Cal = dynamic(() => import("@calcom/embed-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface)">
      <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        cal.com/webstability
      </p>
    </div>
  ),
});

export function CalEmbed({ locale }: { locale: string }) {
  return (
    <Cal
      calLink="webstability"
      style={{ width: "100%", height: "100%", minHeight: 640 }}
      config={{
        layout: "month_view",
        theme: "light",
        // Cal accepts ISO locale; "nl" / "es" both work.
        ...(locale ? { locale } : {}),
      }}
    />
  );
}
