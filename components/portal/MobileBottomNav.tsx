"use client";

import { LayoutDashboard, Inbox, FileText, Activity } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Labels = {
  dashboard: string;
  tickets: string;
  invoices: string;
  monitoring: string;
};

/**
 * Sticky bottom-tab nav voor mobile portal-gebruikers. Vier hoofdroutes —
 * de meest-bezochte volgens strategie: dashboard, tickets, invoices,
 * monitoring. Files/SEO/team/settings zitten in de sidebar (hamburger
 * via MobileNav-dialog die al bestaat).
 *
 * Verschijnt alleen op mobile (md:hidden). Sidebar blijft op desktop.
 * Bottom-padding op de main-area komt via de pb-24 op de layout.
 */
const items = [
  { href: "/portal/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/portal/tickets", icon: Inbox, key: "tickets" },
  { href: "/portal/invoices", icon: FileText, key: "invoices" },
  { href: "/portal/monitoring", icon: Activity, key: "monitoring" },
] as const;

export function MobileBottomNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Portal navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-(--color-border) bg-(--color-surface)/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          const label = labels[key as keyof Labels];
          return (
            <li key={href} className="relative flex-1">
              {/* Actief-indicator — 2px terracotta-balk bovenaan de tab, zodat de
                  actieve sectie ook zonder enkel kleurverschil meteen leesbaar is. */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-(--color-accent)"
                />
              ) : null}
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 transition-colors",
                  active
                    ? "text-(--color-accent)"
                    : "text-(--color-muted) hover:text-(--color-text)",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                <span className="font-mono text-[10px] tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
