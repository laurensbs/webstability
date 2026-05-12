"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Inbox,
  Receipt,
  FileText,
  Activity,
  BarChart3,
  Users,
  Settings,
  Plus,
  ArrowRight,
  X,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type Cmd = { label: string; icon: typeof Inbox; href: string };

/**
 * Lichte command-launcher voor het klantportaal (Cmd/Ctrl+K). Een klant heeft
 * weinig items — dus geen async-search, alleen snelle navigatie + "nieuw ticket".
 * Fuzzy filter op label. Keyboard-driven: ↑↓ navigeert, ↵ opent, esc sluit.
 * Reduced-motion-safe.
 */
export function PortalCommandPalette({
  labels,
}: {
  labels: {
    dashboard: string;
    projects: string;
    tickets: string;
    invoices: string;
    files: string;
    monitoring: string;
    seo: string;
    team: string;
    settings: string;
    newTicket: string;
    placeholder: string;
    empty: string;
    hintEnter: string;
    hintArrows: string;
    hintEsc: string;
    closeLabel: string;
  };
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const ALL: Cmd[] = React.useMemo(
    () => [
      { label: labels.newTicket, icon: Plus, href: "/portal/tickets/new" },
      { label: labels.dashboard, icon: LayoutDashboard, href: "/portal/dashboard" },
      { label: labels.projects, icon: FolderKanban, href: "/portal/projects" },
      { label: labels.tickets, icon: Inbox, href: "/portal/tickets" },
      { label: labels.invoices, icon: Receipt, href: "/portal/invoices" },
      { label: labels.files, icon: FileText, href: "/portal/files" },
      { label: labels.monitoring, icon: Activity, href: "/portal/monitoring" },
      { label: labels.seo, icon: BarChart3, href: "/portal/seo" },
      { label: labels.team, icon: Users, href: "/portal/team" },
      { label: labels.settings, icon: Settings, href: "/portal/settings" },
    ],
    [labels],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((c) => c.label.toLowerCase().includes(q));
  }, [ALL, query]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 40);
      }
      if (e.key === "Escape" && open) close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function go(idx: number) {
    const c = filtered[idx];
    if (!c) return;
    close();
    router.push(c.href as never);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(activeIdx);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-(--color-text)/40 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={labels.placeholder}
            className="shadow-modal rounded-panel relative w-full max-w-md overflow-hidden border border-(--color-border) bg-(--color-surface)"
          >
            <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-(--color-muted)" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onInputKey}
                placeholder={labels.placeholder}
                className="flex-1 bg-transparent text-[14px] text-(--color-text) outline-none placeholder:text-(--color-muted)"
              />
              <button
                type="button"
                onClick={close}
                aria-label={labels.closeLabel}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-(--color-muted) hover:bg-(--color-bg-warm)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-(--color-muted)">
                  {labels.empty}
                </p>
              ) : (
                <ul>
                  {filtered.map((c, i) => {
                    const Icon = c.icon;
                    const isActive = i === activeIdx;
                    return (
                      <li key={c.href}>
                        <button
                          type="button"
                          onClick={() => go(i)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? "bg-(--color-bg-warm)" : ""
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-(--color-muted)" strokeWidth={2} />
                          <span className="flex-1 truncate text-[14px] text-(--color-text)">
                            {c.label}
                          </span>
                          {isActive ? (
                            <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <footer className="flex items-center gap-4 border-t border-(--color-border) bg-(--color-bg-warm) px-4 py-2 text-[10px] text-(--color-muted)">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-(--color-border) bg-(--color-surface) px-1 font-mono">
                  ↵
                </kbd>
                {labels.hintEnter}
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-(--color-border) bg-(--color-surface) px-1 font-mono">
                  ↑↓
                </kbd>
                {labels.hintArrows}
              </span>
              <span className="ml-auto inline-flex items-center gap-1">
                <kbd className="rounded border border-(--color-border) bg-(--color-surface) px-1 font-mono">
                  esc
                </kbd>
                {labels.hintEsc}
              </span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
