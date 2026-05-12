"use client";

import * as React from "react";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { completeLeadAction } from "@/app/actions/leads";

type Reminder = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  status: string;
  nextActionAt: Date | null;
  nextActionLabel: string | null;
  overdue?: boolean;
};

/**
 * Toont leads waarvan nextActionAt <= vandaag (of overdue). Per item
 * twee quick-actions: "klaar" (nextActionAt → null) en "snooze +7d".
 * Empty-state zet aan tot outreach.
 */
export function LeadRemindersWidget({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 p-6">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          <Clock className="h-3 w-3" strokeWidth={2.4} />
          Vandaag opvolgen
        </p>
        <p className="mt-3 text-[14px] text-(--color-muted)">
          Geen opvolg-acties vandaag — schrijf 5 outbound deze week.
        </p>
        <Link
          href={{ pathname: "/admin/leads/new" as never }}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-accent)/90"
        >
          Nieuwe lead toevoegen
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-(--color-border) bg-(--color-surface)">
      <div className="border-b border-(--color-border) px-5 py-3">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-text) uppercase">
          <Clock className="h-3 w-3 text-(--color-accent)" strokeWidth={2.4} />
          Vandaag opvolgen · {reminders.length}
        </p>
      </div>
      <ul className="divide-y divide-(--color-border)">
        {reminders.map((r) => (
          <ReminderRow key={r.id} reminder={r} />
        ))}
      </ul>
    </section>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const [pending, startTransition] = React.useTransition();
  const [pendingAction, setPendingAction] = React.useState<"done" | "snooze" | null>(null);

  const overdue = reminder.overdue ?? false;

  const handle = (snooze: boolean) => {
    setPendingAction(snooze ? "snooze" : "done");
    const fd = new FormData();
    fd.set("snooze", String(snooze));
    startTransition(async () => {
      const result = await completeLeadAction(reminder.id, null, fd);
      setPendingAction(null);
      if (result.ok) {
        toast.success(snooze ? "+7 dagen" : "Afgevinkt");
      } else {
        toast.error("Mislukt");
      }
    });
  };

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <Link
          href={{
            pathname: "/admin/leads/[id]" as never,
            params: { id: reminder.id },
          }}
          className="min-w-0 flex-1 transition-opacity hover:opacity-80"
        >
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-medium text-(--color-text)">
              {reminder.name ?? reminder.email}
            </span>
            {reminder.company ? (
              <span className="font-mono text-[11px] text-(--color-muted)">
                · {reminder.company}
              </span>
            ) : null}
            {overdue ? (
              <span className="rounded-full bg-(--color-wine)/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
                overdue
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
            {reminder.email} · {reminder.status}
          </p>
          {reminder.nextActionLabel ? (
            <p className="mt-2 text-[13px] leading-[1.55] text-(--color-text)">
              → {reminder.nextActionLabel}
            </p>
          ) : null}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handle(false)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-success) px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-success)/90 disabled:opacity-60"
          >
            {pendingAction === "done" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" strokeWidth={2.5} />
            )}
            Klaar
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:border-(--color-accent)/50 hover:text-(--color-text) disabled:opacity-60"
          >
            {pendingAction === "snooze" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            +7d
          </button>
        </div>
      </div>
    </li>
  );
}
