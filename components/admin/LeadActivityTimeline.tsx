import {
  Mail,
  CalendarCheck,
  MousePointerClick,
  StickyNote,
  GitBranch,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Activity = {
  id: string;
  kind: string;
  summary: string;
  createdAt: string;
  actorName: string | null;
};

/** Visuele behandeling per leadActivity-kind: icoon + accentkleur. */
const KIND_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  mail_sent: { icon: Mail, color: "text-(--color-accent)", label: "mail verstuurd" },
  call_booked: { icon: CalendarCheck, color: "text-(--color-teal)", label: "call geboekt" },
  demo_visit: { icon: MousePointerClick, color: "text-(--color-success)", label: "demo bezocht" },
  note_added: { icon: StickyNote, color: "text-(--color-muted)", label: "notitie" },
  status_changed: { icon: GitBranch, color: "text-(--color-wine)", label: "status gewijzigd" },
};

/**
 * Verticale dot↔lijn-tijdlijn van de lead-activiteit — zelfde vocabulaire als
 * de project-stepper: één doorlopende lijn links, een dot+icoon per event.
 * Pure server-component.
 */
export function LeadActivityTimeline({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) {
    return (
      <p className="rounded-card mt-4 border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-5 py-6 text-center text-[14px] text-(--color-muted)">
        Nog geen activiteit. Notitie hierboven start de tijdlijn.
      </p>
    );
  }

  return (
    <div className="relative mt-4 pl-1">
      {/* Doorlopende lijn — van het midden van de eerste dot tot de laatste. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 bottom-3 left-[10px] w-px bg-(--color-border)"
      />
      <ol className="space-y-4">
        {activity.map((a) => {
          const meta = KIND_META[a.kind] ?? {
            icon: Circle,
            color: "text-(--color-muted)",
            label: a.kind,
          };
          const Icon = meta.icon;
          return (
            <li key={a.id} className="relative pl-7">
              <span
                aria-hidden
                className={`absolute top-0.5 left-0 grid h-[21px] w-[21px] place-items-center rounded-full border border-(--color-border) bg-(--color-surface) ${meta.color}`}
              >
                <Icon className="h-3 w-3" strokeWidth={2.2} />
              </span>
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {a.createdAt}
                {a.actorName ? ` · ${a.actorName}` : ""}
                {" · "}
                {meta.label}
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.55] whitespace-pre-wrap text-(--color-text)">
                {a.summary}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
