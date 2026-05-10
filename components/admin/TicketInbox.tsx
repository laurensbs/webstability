"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bug, Sparkles, HelpCircle, AlertCircle, Search, Keyboard } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Ticket } from "@/components/admin/TicketsKanban";

type Status = "open" | "in_progress" | "waiting" | "closed";

type Strings = {
  filters: { all: string; open: string; in_progress: string; waiting: string; closed: string };
  searchPlaceholder: string;
  emptyList: string;
  selectPrompt: string;
  shortcutHint: string;
  shortcutsTitle: string;
  shortcuts: Array<{ keys: string; label: string }>;
  resolved: string;
  reopened: string;
  noOrg: string;
};

const STATUS_FLOW: Record<Status, Status> = {
  open: "in_progress",
  in_progress: "closed",
  waiting: "in_progress",
  closed: "open",
};

const CATEGORY_META = {
  bug: { icon: Bug, color: "text-(--color-wine)" },
  feature: { icon: Sparkles, color: "text-(--color-accent)" },
  question: { icon: HelpCircle, color: "text-(--color-teal)" },
} as const;

/**
 * Inbox-stijl ticket-overzicht voor admin. Tweekolom: linker lijst met
 * j/k-navigatie + status-filters, rechter detail-view met thread-link.
 * Sneltoetsen: j/k navigate, e resolve (cycle status), c close, r reply
 * (link-jump), ? cheatsheet, / focus search. Mobile valt terug op de
 * kanban-view via de bovenliggende page (?view=inbox toggle).
 *
 * Server-actions blijven `changeStatus` zoals de kanban — geen nieuwe
 * mutations nodig.
 */
export function TicketInbox({
  initialTickets,
  changeStatus,
  strings,
}: {
  initialTickets: Ticket[];
  changeStatus: (ticketId: string, status: Status) => Promise<void>;
  strings: Strings;
}) {
  const [tickets, setTickets] = React.useState(initialTickets);
  const [filter, setFilter] = React.useState<"all" | Status>("open");
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [showCheatsheet, setShowCheatsheet] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.organization.name.toLowerCase().includes(q) ||
          (t.user.email ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, filter, query]);

  // Bound active op `filtered.length` zonder effect — derived state.
  const safeIndex =
    filtered.length === 0 ? 0 : Math.min(Math.max(activeIndex, 0), filtered.length - 1);
  const active = filtered[safeIndex] ?? null;

  // Sneltoetsen
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || target?.isContentEditable;

      // / focusst search ook vanuit andere context
      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (inField) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowCheatsheet((s) => !s);
        return;
      }
      if (e.key === "Escape") {
        if (showCheatsheet) setShowCheatsheet(false);
        return;
      }
      if (e.key === "j") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if ((e.key === "e" || e.key === "c") && active) {
        e.preventDefault();
        const next = e.key === "c" ? "closed" : STATUS_FLOW[active.status];
        const prev = active.status;
        // optimistic
        setTickets((all) => all.map((tk) => (tk.id === active.id ? { ...tk, status: next } : tk)));
        changeStatus(active.id, next).catch(() => {
          setTickets((all) =>
            all.map((tk) => (tk.id === active.id ? { ...tk, status: prev } : tk)),
          );
        });
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, active, changeStatus, showCheatsheet]);

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
      {/* LEFT: list */}
      <div className="space-y-3">
        {/* Filters + search */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "open", "in_progress", "waiting", "closed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide transition-colors ${
                filter === f
                  ? "border-(--color-text) bg-(--color-text) text-(--color-bg)"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:text-(--color-text)"
              }`}
            >
              {strings.filters[f]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-(--color-muted)" />
          <input
            ref={searchRef}
            type="search"
            placeholder={strings.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) py-2 pr-3 pl-9 text-[13px] focus:border-(--color-accent)/60 focus:outline-none"
          />
        </div>

        {/* List */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="tickets"
          className="max-h-[70vh] divide-y divide-(--color-border) overflow-y-auto rounded-[14px] border border-(--color-border) bg-(--color-surface)"
        >
          {filtered.length === 0 ? (
            <p className="px-5 py-6 text-[14px] text-(--color-muted)">{strings.emptyList}</p>
          ) : (
            filtered.map((t, i) => {
              const Cat = CATEGORY_META[t.category];
              const isActive = i === activeIndex;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-(--color-bg-warm)" : "hover:bg-(--color-bg-warm)/50"
                  }`}
                >
                  {/* Priority bar */}
                  <span
                    className={`mt-1 h-10 w-1 shrink-0 rounded-full ${
                      t.priority === "high"
                        ? "bg-(--color-accent)"
                        : t.priority === "normal"
                          ? "bg-(--color-muted)"
                          : "bg-(--color-border)"
                    }`}
                    aria-hidden
                  />
                  <Cat.icon
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${Cat.color}`}
                    strokeWidth={2.2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-(--color-text)">
                      {t.subject}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] tracking-wide text-(--color-muted)">
                      {t.organization.name || strings.noOrg} · {t.ageLabel}
                      {t.replyCount > 0 ? ` · ${t.replyCount} replies` : ""}
                      {t.overBudget ? " · over-budget" : ""}
                    </p>
                  </div>
                  {t.status !== "open" ? (
                    <span className="mt-0.5 inline-flex shrink-0 rounded-full border border-(--color-border) px-2 py-0.5 font-mono text-[9px] tracking-widest text-(--color-muted) uppercase">
                      {strings.filters[t.status]}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Shortcut hint */}
        <button
          type="button"
          onClick={() => setShowCheatsheet(true)}
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase hover:text-(--color-text)"
        >
          <Keyboard className="h-3 w-3" strokeWidth={2.2} />
          {strings.shortcutHint}
        </button>
      </div>

      {/* RIGHT: detail */}
      <aside className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-6">
        {active ? (
          <ActiveTicketPanel ticket={active} strings={strings} />
        ) : (
          <p className="text-[14px] text-(--color-muted)">{strings.selectPrompt}</p>
        )}
      </aside>

      {/* Cheatsheet */}
      <AnimatePresence>
        {showCheatsheet ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-text)/40 px-4"
            onClick={() => setShowCheatsheet(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="rounded-[18px] border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif text-[20px]">{strings.shortcutsTitle}</h3>
              <ul className="mt-4 space-y-2">
                {strings.shortcuts.map((s) => (
                  <li key={s.keys} className="flex items-center justify-between gap-6 text-[13px]">
                    <span className="text-(--color-muted)">{s.label}</span>
                    <kbd className="rounded border border-(--color-border) bg-(--color-bg-warm) px-2 py-0.5 font-mono text-[11px]">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ActiveTicketPanel({ ticket, strings }: { ticket: Ticket; strings: Strings }) {
  const Cat = CATEGORY_META[ticket.category];
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Cat.icon className={`mt-1 h-4 w-4 shrink-0 ${Cat.color}`} strokeWidth={2.2} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-medium text-(--color-text)">{ticket.subject}</h3>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {ticket.organization.name} · {ticket.user.email} · {ticket.ageLabel}
            {ticket.overBudget ? " · over-budget" : ""}
          </p>
        </div>
        {ticket.priority === "high" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-accent)/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
            high
          </span>
        ) : null}
      </div>
      <div className="rounded-[12px] border border-(--color-border) bg-(--color-bg-warm) p-4">
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          status: {strings.filters[ticket.status]} · {ticket.replyCount} replies
        </p>
      </div>
      <Link
        href={{ pathname: `/admin/tickets/${ticket.id}` as never }}
        className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90"
      >
        Open thread →
      </Link>
    </div>
  );
}
