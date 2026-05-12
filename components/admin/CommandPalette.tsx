"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Building2,
  Inbox,
  FolderKanban,
  ArrowRight,
  X,
  LayoutDashboard,
  UserPlus,
  PlusCircle,
  Newspaper,
  Star,
  Gift,
  Receipt,
  CreditCard,
  Clock,
} from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";

type ResultKind = "org" | "ticket" | "project";
type Result = {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string;
};

/**
 * Snelle acties/navigatie wanneer de query leeg is — zodat Cmd+K niet alleen
 * een zoekvak is maar ook een launcher. Hrefs als string (router.push pakt 'm).
 */
type QuickAction = { label: string; icon: typeof Building2; href: string };
const QUICK_ACTIONS: QuickAction[] = [
  { label: "Nieuwe lead", icon: UserPlus, href: "/admin/leads/new" },
  { label: "Nieuwe klant (org)", icon: PlusCircle, href: "/admin/orgs/new" },
  { label: "Naar dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Naar klanten", icon: Building2, href: "/admin/orgs" },
  { label: "Naar tickets", icon: Inbox, href: "/admin/tickets" },
  { label: "Naar leads", icon: UserPlus, href: "/admin/leads" },
  { label: "Naar blog-queue", icon: Newspaper, href: "/admin/blog" },
  { label: "Naar NPS", icon: Star, href: "/admin/nps" },
  { label: "Naar referrals", icon: Gift, href: "/admin/referrals" },
];

type Strings = {
  placeholder: string;
  empty: string;
  emptyHint: string;
  recentTitle: string;
  hintEnter: string;
  hintEsc: string;
  hintArrows: string;
  closeLabel: string;
};

const KIND_META: Record<ResultKind, { icon: typeof Building2; label: string; color: string }> = {
  org: { icon: Building2, label: "klant", color: "text-(--color-wine)" },
  ticket: { icon: Inbox, label: "ticket", color: "text-(--color-accent)" },
  project: { icon: FolderKanban, label: "project", color: "text-(--color-success)" },
};

/**
 * Cmd+K (of ctrl+K) opent een Linear/Raycast-stijl command palette
 * met fuzzy-search over orgs / tickets / projects. Resultaten worden
 * fetched van /api/admin/search?q=... met 150ms debounce.
 *
 * Keyboard-driven: arrow up/down navigeert, enter opent, esc sluit.
 */
export function CommandPalette({ strings }: { strings: Strings }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Contextuele acties — afhankelijk van waar je bent. Op een org-detailpagina
  // krijg je sneltoetsen naar de tabs van die klant; anders alleen QUICK_ACTIONS.
  const actions = React.useMemo<QuickAction[]>(() => {
    const m = pathname.match(/^\/admin\/orgs\/([^/?]+)/);
    if (m && m[1] && m[1] !== "new") {
      const orgId = m[1];
      return [
        {
          label: "Projecten van deze klant",
          icon: FolderKanban,
          href: `/admin/orgs/${orgId}?tab=projects`,
        },
        { label: "Facturen & bestanden", icon: Receipt, href: `/admin/orgs/${orgId}?tab=files` },
        {
          label: "Abonnement van deze klant",
          icon: CreditCard,
          href: `/admin/orgs/${orgId}?tab=subscription`,
        },
        {
          label: "Uren loggen voor deze klant",
          icon: Clock,
          href: `/admin/orgs/${orgId}?tab=hours`,
        },
        ...QUICK_ACTIONS,
      ];
    }
    return QUICK_ACTIONS;
  }, [pathname]);

  // Helper om state samen te resetten — wordt gebruikt door alle close-paths.
  const closePalette = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIdx(0);
  }, []);

  // Open on cmd/ctrl+K
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        // Focus na re-render
        window.setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && open) {
        closePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePalette]);

  // Debounced search — fetch zit in setTimeout zodat de setState's in
  // de async callback buiten React's effect-body lopen (lint-rule).
  React.useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) return;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { results: Result[] };
          setResults(data.results);
          setActiveIdx(0);
        }
      } catch {
        // noop — search is best-effort
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  // Reset results wanneer query te kort is. Niet via effect — via
  // controlled input-handler hieronder (resetIfTooShort).
  const isSearching = query.trim().length >= 2;
  const visibleResults = isSearching ? results : [];
  // De navigeerbare lijst: zoekresultaten als er gezocht wordt, anders de
  // quick-actions. Eén `activeIdx` voor beide.
  const navCount = isSearching ? visibleResults.length : actions.length;

  function resetIfTooShort(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setActiveIdx(0);
    }
  }

  function handleSelect(r: Result) {
    closePalette();
    if (r.kind === "org") {
      router.push({ pathname: "/admin/orgs/[orgId]", params: { orgId: r.id } });
    } else if (r.kind === "ticket") {
      // Tickets-pagina; eventueel later met deep-link naar specifiek ticket
      router.push("/admin/tickets");
    } else if (r.kind === "project") {
      // Geen aparte project-route in admin; ga naar de org
      router.push("/admin/orgs");
    }
  }

  function handleAction(a: QuickAction) {
    closePalette();
    router.push(a.href as never);
  }

  function activate(idx: number) {
    if (isSearching) {
      const r = visibleResults[idx];
      if (r) handleSelect(r);
    } else {
      const a = actions[idx];
      if (a) handleAction(a);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(navCount - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(activeIdx);
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
            if (e.target === e.currentTarget) closePalette();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={strings.placeholder}
            className="shadow-modal relative w-full max-w-xl overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-(--color-muted)" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => resetIfTooShort(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={strings.placeholder}
                className="flex-1 bg-transparent text-[14px] text-(--color-text) outline-none placeholder:text-(--color-muted)"
              />
              <button
                type="button"
                onClick={closePalette}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-(--color-muted) hover:bg-(--color-bg-warm)"
                aria-label={strings.closeLabel}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results — zoekresultaten als er gezocht wordt, anders quick-actions */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!isSearching ? (
                <>
                  <p className="px-4 pt-3 pb-1 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {strings.recentTitle}
                  </p>
                  <ul className="divide-y divide-(--color-border)">
                    {actions.map((a, i) => {
                      const Icon = a.icon;
                      const isActive = i === activeIdx;
                      return (
                        <li key={a.href + a.label}>
                          <button
                            type="button"
                            onClick={() => handleAction(a)}
                            onMouseEnter={() => setActiveIdx(i)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive ? "bg-(--color-bg-warm)" : ""
                            }`}
                          >
                            <Icon
                              className="h-4 w-4 shrink-0 text-(--color-muted)"
                              strokeWidth={2}
                            />
                            <span className="flex-1 truncate text-[14px] text-(--color-text)">
                              {a.label}
                            </span>
                            {isActive ? (
                              <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : loading && visibleResults.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-(--color-muted)">…</p>
              ) : visibleResults.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-(--color-muted)">
                  {strings.empty}
                </p>
              ) : (
                <ul className="divide-y divide-(--color-border)">
                  {visibleResults.map((r, i) => {
                    const meta = KIND_META[r.kind];
                    const Icon = meta.icon;
                    const isActive = i === activeIdx;
                    return (
                      <li key={`${r.kind}-${r.id}`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(r)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isActive ? "bg-(--color-bg-warm)" : ""
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} strokeWidth={2} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-(--color-text)">
                              {r.title}
                            </p>
                            {r.subtitle ? (
                              <p className="truncate text-[12px] text-(--color-muted)">
                                {r.subtitle}
                              </p>
                            ) : null}
                          </div>
                          <span className="font-mono text-[10px] tracking-wider text-(--color-muted) uppercase">
                            {meta.label}
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
                {strings.hintEnter}
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-(--color-border) bg-(--color-surface) px-1 font-mono">
                  ↑↓
                </kbd>
                {strings.hintArrows}
              </span>
              <span className="ml-auto inline-flex items-center gap-1">
                <kbd className="rounded border border-(--color-border) bg-(--color-surface) px-1 font-mono">
                  esc
                </kbd>
                {strings.hintEsc}
              </span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
