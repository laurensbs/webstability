/**
 * Strip met wordmark-stijl namen van échte sites die we draaien of in
 * onderhoud houden. Mix serif (Fraunces) / sans (Inter) + italic-toggle
 * voor een hand-gezet gevoel i.p.v. een logo-grid. Namen komen 1-op-1
 * overeen met de cases op /cases. Geen koptekst — de namen spreken zelf.
 */
export function LogoStrip() {
  const items: Array<{ name: string; sans?: boolean; italic?: boolean }> = [
    { name: "Caravanverhuurspanje" },
    { name: "Caravanreparatiespanje", sans: true },
    { name: "Caravanstallingspanje", italic: true },
    { name: "Thebeautifullife", sans: true },
    { name: "Hoogduinonderhoud" },
    { name: "Rietveld Hoveniers", sans: true },
  ];

  return (
    <section className="border-y border-(--color-border) bg-(--color-bg-warm) py-[60px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4 opacity-70">
          {items.map((item) => (
            <span
              key={item.name}
              className={
                item.sans
                  ? "text-[18px] font-bold tracking-[-0.03em] text-(--color-muted)"
                  : `font-serif text-[22px] font-medium tracking-[-0.02em] text-(--color-muted) ${
                      item.italic ? "italic" : ""
                    }`
              }
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
