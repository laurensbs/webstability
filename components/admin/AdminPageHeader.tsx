/**
 * Eén consistente pagina-header voor alle admin-routes: titel (serif, clamp),
 * optionele subtitle, optionele actie-slot rechts (een knop, een view-toggle…).
 * Vervangt de drie verschillende header-stijlen die er rondzwierven.
 *
 * Pure server-component — geen state, geen "use client".
 */
export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 className="font-serif text-[clamp(28px,4vw,38px)] leading-tight text-(--color-text)">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-prose text-[14px] text-(--color-muted)">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
