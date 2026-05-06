import { ShieldCheck } from "lucide-react";

/**
 * Security & backups statuskaart op het portal-dashboard. Voor Care-
 * klanten is dit het hoofdverhaal van wat ze betalen; voor Studio en
 * Atelier blijft het belangrijk maar staat het naast andere widgets.
 *
 * De data is op dit moment placeholder ('alles up-to-date'); zodra we
 * een audit-systeem aansluiten (Phase 4) komen er echte timestamps.
 */
export function SecurityCard({
  strings,
}: {
  strings: {
    title: string;
    statusLabel: string;
    statusValue: string;
    backupLabel: string;
    backupValue: string;
    sslLabel: string;
    sslValue: string;
    soonNote: string;
  };
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
      <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-(--color-success)" strokeWidth={2} />
          <h2 className="text-base font-medium">{strings.title}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-success)/10 px-2.5 py-1 font-mono text-[10px] tracking-widest text-(--color-success) uppercase">
          <span
            className="h-1.5 w-1.5 rounded-full bg-(--color-success)"
            style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
          />
          ok
        </span>
      </header>

      <dl className="divide-y divide-(--color-border)">
        <Row label={strings.statusLabel} value={strings.statusValue} accent />
        <Row label={strings.backupLabel} value={strings.backupValue} />
        <Row label={strings.sslLabel} value={strings.sslValue} />
      </dl>

      <p className="border-t border-(--color-border) bg-(--color-bg-warm) px-5 py-3 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {strings.soonNote}
      </p>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-[13px] text-(--color-muted)">{label}</dt>
      <dd
        className={`font-mono text-[12px] ${accent ? "text-(--color-success)" : "text-(--color-text)"}`}
      >
        {value}
      </dd>
    </div>
  );
}
