import { Calendar, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Call = {
  id: string;
  type: "welcome_call" | "review_call" | "strategy_call";
  startsAt: Date;
  attendeeEmail: string | null;
  attendeeName: string | null;
  meetingUrl: string | null;
  notes: string | null;
  organizationId: string;
  orgName: string;
  orgSlug: string;
};

const TYPE_LABEL: Record<Call["type"], string> = {
  welcome_call: "Welcome call",
  review_call: "Review call",
  strategy_call: "Strategie",
};

/**
 * Widget op /admin overview die de eerstvolgende geplande calls toont.
 * Klik door naar de OrgDetail-page van de klant zodat staff de intake-
 * antwoorden vlak voor de call kan doorlezen.
 */
export function UpcomingCallsWidget({ calls, locale }: { calls: Call[]; locale: string }) {
  const dateFmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (calls.length === 0) {
    return (
      <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <header className="mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-(--color-accent)" strokeWidth={2.4} />
          <h2 className="font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
            Aankomende calls
          </h2>
        </header>
        <p className="text-[14px] text-(--color-muted)">
          Geen geplande calls. Nieuwe klanten boeken automatisch via de intake.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-(--color-accent)" strokeWidth={2.4} />
          <h2 className="font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
            Aankomende calls
          </h2>
        </div>
        <span className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {calls.length}
        </span>
      </header>
      <ul className="divide-y divide-(--color-border)">
        {calls.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={{
                  pathname: "/admin/orgs/[orgId]",
                  params: { orgId: c.organizationId },
                }}
                className="block truncate text-[14px] font-medium text-(--color-text) transition-colors hover:text-(--color-accent)"
              >
                {c.orgName}
              </Link>
              <p className="mt-0.5 truncate font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                {TYPE_LABEL[c.type]}
                {c.attendeeName ? ` · ${c.attendeeName}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-[11px] text-(--color-text)">
                {dateFmt.format(c.startsAt)}
              </span>
              {c.meetingUrl ? (
                <a
                  href={c.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-(--color-accent) hover:underline"
                >
                  meeting
                  <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.4} />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
