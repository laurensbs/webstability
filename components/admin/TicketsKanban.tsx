"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  KeyboardSensor,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { Bug, Sparkles, HelpCircle, AlertCircle, PencilLine, ArrowUpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Status = "open" | "in_progress" | "waiting" | "closed";
type Category = "bug" | "feature" | "question" | "change" | "upgrade";
type Priority = "low" | "normal" | "high";

export type Ticket = {
  id: string;
  subject: string;
  status: Status;
  category: Category;
  priority: Priority;
  overBudget: boolean;
  /** Server-side berekend leeftijd-label (bv. "3d", "5u"). Houdt
   * client-render pure; precieze waarde verandert pas bij volgende
   * page-load, wat OK is voor admin-triage. */
  ageLabel: string;
  organization: { id: string; name: string; slug: string };
  user: { name: string | null; email: string };
  replyCount: number;
};

type Strings = {
  columns: Record<Status, string>;
  emptyColumn: string;
  noOrg: string;
  filterAll: string;
  filterCategory: string;
  filterPriority: string;
};

const COLUMNS: Status[] = ["open", "in_progress", "waiting", "closed"];

const CATEGORY_META: Record<
  Category,
  { icon: typeof Bug; bg: string; text: string; label: (s: Strings) => string }
> = {
  bug: {
    icon: Bug,
    bg: "bg-(--color-wine)/10",
    text: "text-(--color-wine)",
    label: () => "bug",
  },
  feature: {
    icon: Sparkles,
    bg: "bg-(--color-accent)/10",
    text: "text-(--color-accent)",
    label: () => "feature",
  },
  question: {
    icon: HelpCircle,
    bg: "bg-(--color-teal)/10",
    text: "text-(--color-teal)",
    label: () => "vraag",
  },
  change: {
    icon: PencilLine,
    bg: "bg-(--color-accent)/10",
    text: "text-(--color-accent)",
    label: () => "wijziging",
  },
  upgrade: {
    icon: ArrowUpCircle,
    bg: "bg-(--color-wine)/10",
    text: "text-(--color-wine)",
    label: () => "upgrade",
  },
};

/**
 * Drag-and-drop kanban van cross-org tickets. 4 kolommen: Inbox →
 * In behandeling → Wacht → Gesloten. Optimistic update bij drop;
 * server-action volgt async via formData. Bij failure draaien we de
 * UI terug.
 *
 * Action-prop: `(ticketId, status) => Promise<void>` — wrapper om de
 * bestaande updateTicketStatus server-action.
 */
export function TicketsKanban({
  initialTickets,
  changeStatus,
  strings,
}: {
  initialTickets: Ticket[];
  changeStatus: (ticketId: string, status: Status) => Promise<void>;
  strings: Strings;
}) {
  const [tickets, setTickets] = React.useState(initialTickets);
  const [filterCategory, setFilterCategory] = React.useState<"all" | Category>("all");
  const [filterPriority, setFilterPriority] = React.useState<"all" | Priority>("all");
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const filtered = React.useMemo(() => {
    return tickets.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tickets, filterCategory, filterPriority]);

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const ticketId = String(e.active.id);
    const newStatus = String(e.over.id) as Status;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Optimistic
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));

    // Server fire-and-forget; rollback bij error
    changeStatus(ticketId, newStatus).catch(() => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: ticket.status } : t)),
      );
    });
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as "all" | Category)}
          className="min-h-9 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1 text-[13px]"
        >
          <option value="all">
            {strings.filterCategory}: {strings.filterAll}
          </option>
          <option value="bug">bug</option>
          <option value="feature">feature</option>
          <option value="question">vraag</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as "all" | Priority)}
          className="min-h-9 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1 text-[13px]"
        >
          <option value="all">
            {strings.filterPriority}: {strings.filterAll}
          </option>
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((status) => {
            const colTickets = filtered.filter((t) => t.status === status);
            return (
              <Column
                key={status}
                status={status}
                label={strings.columns[status]}
                count={colTickets.length}
              >
                <AnimatePresence>
                  {colTickets.map((t) => (
                    <TicketCard key={t.id} ticket={t} strings={strings} />
                  ))}
                </AnimatePresence>
                {colTickets.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-(--color-muted)">
                    {strings.emptyColumn}
                  </p>
                ) : null}
              </Column>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  label,
  count,
  children,
}: {
  status: Status;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-2xl border p-3 transition-colors ${
        isOver
          ? "border-(--color-accent)/50 bg-(--color-accent-soft)/30"
          : "border-(--color-border) bg-(--color-bg-warm)/50"
      }`}
    >
      <header className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-[12px] font-medium tracking-[0.04em] text-(--color-text)">{label}</h3>
        <span className="font-mono text-[11px] text-(--color-muted)">{count}</span>
      </header>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TicketCard({ ticket, strings }: { ticket: Ticket; strings: Strings }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });
  const meta = CATEGORY_META[ticket.category];
  const Icon = meta.icon;

  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.85 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border bg-(--color-surface) p-3 shadow-sm transition-shadow active:cursor-grabbing ${
        isDragging ? "shadow-card border-(--color-accent)" : "border-(--color-border)"
      } ${ticket.priority === "high" ? "border-l-2 border-l-(--color-wine)" : ""}`}
    >
      <header className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.text}`}
        >
          <Icon className="h-3 w-3" />
          {meta.label(strings)}
        </span>
        {ticket.overBudget ? (
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-(--color-wine)" />
        ) : null}
      </header>
      <Link
        href={{ pathname: "/admin/orgs/[orgId]", params: { orgId: ticket.organization.id } }}
        className="mt-2 block truncate text-[11px] text-(--color-muted) hover:text-(--color-accent)"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {ticket.organization.name || strings.noOrg}
      </Link>
      <p className="mt-1 line-clamp-2 text-[13px] font-medium text-(--color-text)">
        {ticket.subject}
      </p>
      <footer className="mt-2 flex items-center justify-between text-[11px] text-(--color-muted)">
        <span className="font-mono">{ticket.ageLabel}</span>
        {ticket.replyCount > 0 ? <span className="font-mono">{ticket.replyCount} ↩</span> : null}
      </footer>
    </motion.div>
  );
}
