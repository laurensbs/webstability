"use client";

import {
  LayoutDashboard,
  Building2,
  UserPlus,
  Inbox,
  PenLine,
  Star,
  Gift,
  Users,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Labels = {
  overview: string;
  orgs: string;
  leads: string;
  tickets: string;
  blog: string;
  nps: string;
  referrals: string;
  team: string;
};

const items = [
  { href: "/admin", icon: LayoutDashboard, key: "overview", exact: true },
  { href: "/admin/orgs", icon: Building2, key: "orgs", exact: false },
  { href: "/admin/leads", icon: UserPlus, key: "leads", exact: false },
  { href: "/admin/tickets", icon: Inbox, key: "tickets", exact: false },
  { href: "/admin/blog", icon: PenLine, key: "blog", exact: false },
  { href: "/admin/nps", icon: Star, key: "nps", exact: false },
  { href: "/admin/referrals", icon: Gift, key: "referrals", exact: false },
  { href: "/admin/team", icon: Users, key: "team", exact: false },
] as const;

export function AdminNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  return (
    // Horizontaal scrollbaar op mobiel i.p.v. wrappen — 8 items in 2-3 rijen
    // neemt te veel verticale ruimte op 375px. Touch-doelen min-h 44px conform
    // mobile-richtlijn. Scrollbar verborgen om druk visueel rustig te houden;
    // de inhoud is duidelijk genoeg dat 'ie horizontaal scrollt (active item
    // schuift mee in beeld via scroll-snap).
    <nav className="-mx-1 overflow-x-auto rounded-md border border-(--color-border) bg-(--color-surface) p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-1">
        {items.map(({ href, icon: Icon, key, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-(--color-text) text-(--color-bg) shadow-[inset_0_-2px_0_var(--color-wine)]"
                  : "text-(--color-muted) hover:text-(--color-text)",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {labels[key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
