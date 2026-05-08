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
  Menu,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";
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

function NavList({ labels, onNavigate }: { labels: Labels; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map(({ href, icon: Icon, key }) => {
        const active = pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
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
  );
}

export function Sidebar({ labels }: { labels: Labels }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-(--color-border) bg-(--color-bg-warm)/60 md:block">
      <div className="px-6 py-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          webstability<span className="text-(--color-accent)">.</span>
        </Link>
      </div>
      <nav className="px-3 pb-6">
        <NavList labels={labels} />
      </nav>
    </aside>
  );
}

export function MobileNav({ labels }: { labels: Labels }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-(--color-border) text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-40 bg-(--color-text)/40 backdrop-blur-sm md:hidden" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-(--color-border) bg-(--color-bg) shadow-xl md:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex items-center justify-between px-6 py-5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-extrabold tracking-tight"
            >
              webstability<span className="text-(--color-accent)">.</span>
            </Link>
            <Dialog.Close
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-6">
            <NavList labels={labels} onNavigate={() => setOpen(false)} />
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
