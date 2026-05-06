"use client";

import { LayoutDashboard, Building2, Inbox } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Labels = { overview: string; orgs: string; tickets: string };

const items = [
  { href: "/admin", icon: LayoutDashboard, key: "overview", exact: true },
  { href: "/admin/orgs", icon: Building2, key: "orgs", exact: false },
  { href: "/admin/tickets", icon: Inbox, key: "tickets", exact: false },
] as const;

export function AdminNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-md border border-(--color-border) bg-(--color-surface) p-1">
      {items.map(({ href, icon: Icon, key, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-(--color-text) text-(--color-bg) shadow-[inset_0_-2px_0_var(--color-wine)]"
                : "text-(--color-muted) hover:text-(--color-text)",
            )}
          >
            <Icon className="h-4 w-4" />
            {labels[key]}
          </Link>
        );
      })}
    </nav>
  );
}
