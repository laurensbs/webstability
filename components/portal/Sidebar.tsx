"use client";

import {
  LayoutDashboard,
  Folders,
  Inbox,
  FileText,
  Settings,
  Activity,
  Search,
  FileBox,
  Users,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Labels = {
  dashboard: string;
  projects: string;
  tickets: string;
  invoices: string;
  monitoring: string;
  seo: string;
  files: string;
  team: string;
  settings: string;
};

const items = [
  { href: "/portal/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/portal/projects", icon: Folders, key: "projects" },
  { href: "/portal/tickets", icon: Inbox, key: "tickets" },
  { href: "/portal/invoices", icon: FileText, key: "invoices" },
  { href: "/portal/monitoring", icon: Activity, key: "monitoring" },
  { href: "/portal/seo", icon: Search, key: "seo" },
  { href: "/portal/files", icon: FileBox, key: "files" },
  { href: "/portal/team", icon: Users, key: "team" },
  { href: "/portal/settings", icon: Settings, key: "settings" },
] as const;

export function Sidebar({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-(--color-border) bg-(--color-bg-warm)/60 md:block">
      <div className="px-6 py-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          webstability<span className="text-(--color-accent)">.</span>
        </Link>
      </div>
      <nav className="px-3 pb-6">
        <ul className="space-y-1">
          {items.map(({ href, icon: Icon, key }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-(--color-text) text-(--color-bg)"
                      : "text-(--color-muted) hover:bg-(--color-bg-warm) hover:text-(--color-text)",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {labels[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
