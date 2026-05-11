"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Users,
  Sparkles,
  PenLine,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: "/admin" | "/admin/orgs" | "/admin/tickets" | "/admin/blog" | "/admin/team";
  icon: LucideIcon;
  key: "overview" | "orgs" | "tickets" | "blog" | "team";
  shortcut?: string;
  exact?: boolean;
};

const ITEMS: Item[] = [
  { href: "/admin", icon: LayoutDashboard, key: "overview", shortcut: "g d", exact: true },
  { href: "/admin/orgs", icon: Building2, key: "orgs", shortcut: "g o" },
  { href: "/admin/tickets", icon: Inbox, key: "tickets", shortcut: "g t" },
  { href: "/admin/blog", icon: PenLine, key: "blog", shortcut: "g b" },
  { href: "/admin/team", icon: Users, key: "team", shortcut: "g s" },
];

type Labels = {
  overview: string;
  orgs: string;
  tickets: string;
  blog: string;
  team: string;
  collapse: string;
  brandTagline: string;
  portalLink: string;
};

const STORAGE_KEY = "wb-admin-sidebar-collapsed";

/**
 * Verticale Linear-stijl sidebar voor /admin/*. Verplaatst nav-items
 * van de top-bar naar een persistente zijbalk met:
 * - Active-indicator als shared-element (motion.div layoutId)
 * - Keyboard-shortcut hints rechts van elk item (g+o, g+t, etc.)
 * - Collapse-toggle die de sidebar naar 56px icon-only knipt; voorkeur
 *   in localStorage
 * - Brand-blok bovenaan met tagline (vervangt header-logo)
 *
 * Niet-collapsed: 220px. Collapsed: 56px.
 */
export function AdminSidebar({ labels, email }: { labels: Labels; email: string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // private mode — voorkeur voor sessie
    }
  }

  // Keyboard shortcuts: g d / g o / g t / g s — Linear-stijl 2-key.
  // Werkt vanuit elke admin-pagina; we listenen alleen 'g' gevolgd door
  // een letter binnen 800ms.
  const router = useRouter();
  React.useEffect(() => {
    let pendingG = false;
    let timer: number | null = null;
    function onKey(e: KeyboardEvent) {
      // Ignore wanneer er een input/textarea focused is.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        pendingG = true;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          pendingG = false;
        }, 800);
        return;
      }
      if (pendingG) {
        pendingG = false;
        if (timer) window.clearTimeout(timer);
        if (e.key === "d") router.push("/admin");
        else if (e.key === "o") router.push("/admin/orgs");
        else if (e.key === "t") router.push("/admin/tickets");
        else if (e.key === "b") router.push("/admin/blog");
        else if (e.key === "s") router.push("/admin/team");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col gap-2 border-r border-(--color-text)/15 bg-(--color-text) p-3 text-(--color-bg) transition-[width] duration-300 md:flex",
        collapsed ? "w-[56px]" : "w-[220px]",
      )}
    >
      {/* Brand */}
      <Link
        href="/admin"
        className="mb-2 flex items-center gap-2 rounded-md px-2 py-2 text-(--color-bg) transition-opacity hover:opacity-90"
      >
        <span className="text-[18px] font-extrabold tracking-[-0.04em]">
          w<span className="text-(--color-accent)">.</span>
        </span>
        {!collapsed ? (
          <span className="font-mono text-[10px] tracking-[0.1em] text-(--color-bg)/55 uppercase">
            studio
          </span>
        ) : null}
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "text-(--color-bg)"
                  : "text-(--color-bg)/55 hover:bg-(--color-bg)/5 hover:text-(--color-bg)/85",
              )}
              title={collapsed ? labels[item.key] : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 rounded-md bg-(--color-bg)/10 ring-1 ring-(--color-wine)/40"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  aria-hidden
                />
              ) : null}
              {/* Wijn-rode left-bar voor active */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-r bg-(--color-wine)"
                />
              ) : null}
              <Icon className="relative h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed ? (
                <>
                  <span className="relative truncate">{labels[item.key]}</span>
                  {item.shortcut ? (
                    <span className="relative ml-auto hidden font-mono text-[10px] tracking-wider text-(--color-bg)/40 group-hover:inline">
                      {item.shortcut}
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-(--color-bg)/10 pt-3">
        {!collapsed && email ? (
          <p className="truncate px-2 font-mono text-[10px] text-(--color-bg)/40">{email}</p>
        ) : null}
        <Link
          href="/portal/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-[12px] text-(--color-bg)/55 transition-colors hover:bg-(--color-bg)/5 hover:text-(--color-bg)/85",
          )}
          title={collapsed ? labels.portalLink : undefined}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          {!collapsed ? <span>↗ portal</span> : null}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={labels.collapse}
          aria-expanded={!collapsed}
          className="flex items-center gap-3 rounded-md px-2.5 py-2 text-[12px] text-(--color-bg)/55 transition-colors hover:bg-(--color-bg)/5 hover:text-(--color-bg)/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          title={labels.collapse}
        >
          <ChevronLeft
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed ? <span>{labels.collapse}</span> : null}
        </button>
      </div>
    </aside>
  );
}

// `useRouter` from i18n/navigation gives us locale-aware `push`. Imported
// last to avoid a top-of-file circular import in the build graph.
import { useRouter } from "@/i18n/navigation";
