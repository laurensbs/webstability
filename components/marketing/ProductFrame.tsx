/**
 * Donker browser-frame placeholder voor service-cards. Plek-houder
 * voor toekomstige echte product-screenshots. Tot die tijd: cream
 * serif-italic productlijn-naam op donker met conic-mesh hint.
 *
 * Geen client-component nodig — pure server-render. Honoreert
 * prefers-reduced-motion via globals.css `wb-soft-halo` rule.
 */
export function ProductFrame({
  url,
  title,
  accentColor = "var(--color-accent)",
}: {
  /** URL die in de address-bar staat, bv. "admin.jouwbedrijf.nl/bookings". */
  url: string;
  /** Productlijn-naam, bv. "Bedrijfssoftware". */
  title: string;
  /** CSS-kleur voor de center-gradient-glow. Default: terracotta. */
  accentColor?: string;
}) {
  return (
    <div className="shadow-floating rounded-card relative aspect-[16/10] w-full overflow-hidden border border-(--color-text)/10 bg-(--color-text)">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-(--color-bg)/10 bg-(--color-text) px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/15" />
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/15" />
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/15" />
        <span className="ml-3 truncate font-mono text-[10px] tracking-wide text-(--color-bg)/50">
          {url}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-success)" />
          <span className="font-mono text-[9px] tracking-widest text-(--color-bg)/45 uppercase">
            live
          </span>
        </span>
      </div>

      {/* Body — gradient backdrop met serif productlijn-naam */}
      <div className="relative flex h-full items-center justify-center px-6 pb-8">
        {/* Soft accent halo */}
        <span
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute top-1/2 left-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: accentColor }}
        />
        {/* Subtiele grid-lijnen voor depth */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,240,232,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,232,1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 text-center">
          <p className="font-mono text-[10px] tracking-widest text-(--color-bg)/55 uppercase">
            {"// "}
            {title.toLowerCase()}
          </p>
          <p className="mt-3 font-serif text-[clamp(28px,3.5vw,42px)] leading-[1.05] text-(--color-bg) italic">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
