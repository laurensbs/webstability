"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type TabKey =
  | "overview"
  | "subscription"
  | "projects"
  | "tickets"
  | "invoices"
  | "hours"
  | "files"
  | "activity"
  | "danger";

type Tab = {
  key: TabKey;
  label: string;
  count?: number;
  accent?: boolean;
};

/**
 * Verticale tabs links + content rechts (Linear/Inferno-stijl). Active
 * tab tracked via ?tab=... search param zodat bookmark + back-button
 * werken. Indicator-streepje glijdt smooth tussen tabs via
 * motion.div met layoutId.
 *
 * Children worden gepasseerd als een record van TabKey → React.ReactNode;
 * we tonen alleen de actieve tab's content. Niet-actieve content blijft
 * niet gemount zodat we geen onnodige client-side load doen voor data
 * die de user (nog) niet ziet.
 */
export function OrgDetailTabs({
  tabs,
  defaultTab = "overview",
  panels,
}: {
  tabs: Tab[];
  defaultTab?: TabKey;
  panels: Partial<Record<TabKey, React.ReactNode>>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabFromUrl = (searchParams.get("tab") as TabKey | null) ?? defaultTab;
  const valid = tabs.some((t) => t.key === tabFromUrl) ? tabFromUrl : defaultTab;

  function selectTab(key: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const panel = panels[valid] ?? panels[defaultTab];

  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr]">
      {/* Tab nav — verticaal op desktop, horizontal-scroll op mobile */}
      <nav
        aria-label="Klant-tabs"
        className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:border-r md:border-(--color-border) md:pr-4"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === valid;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              className={cn(
                "relative inline-flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium whitespace-nowrap transition-colors",
                isActive ? "text-(--color-text)" : "text-(--color-muted) hover:text-(--color-text)",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="org-tab-indicator"
                  className="absolute inset-0 rounded-md bg-(--color-bg-warm)"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  aria-hidden
                />
              ) : null}
              <span className="relative">{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 ? (
                <span
                  className={cn(
                    "relative inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium",
                    tab.accent
                      ? "bg-(--color-accent) text-white"
                      : "bg-(--color-border) text-(--color-muted)",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">{panel}</div>
    </div>
  );
}
