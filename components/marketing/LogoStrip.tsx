import { getTranslations } from "next-intl/server";

/**
 * "Trusted by" strip — alternating Fraunces serif and Inter sans logo
 * placeholders to create a varied, hand-set feel rather than a logo grid
 * (which would require real client logos we don't have yet).
 */
export async function LogoStrip() {
  const t = await getTranslations("home.logoStrip");

  // Mix of serif (Fraunces) and sans (Inter) "logo-style" wordmarks.
  // Italic toggle adds variety. Replace with real client logos later.
  const items: Array<{ name: string; sans?: boolean; italic?: boolean }> = [
    { name: "Costa Caravans" },
    { name: "Repair&Roll", sans: true },
    { name: "Marbella Stays", italic: true },
    { name: "VOLT/AUTO", sans: true },
    { name: "Bakker & Zn." },
    { name: "Mediterrana", sans: true },
  ];

  return (
    <section className="border-y border-(--color-border) bg-(--color-bg-warm) py-[60px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="mb-7 text-center font-mono text-[11px] tracking-[0.1em] text-(--color-muted) uppercase">
          {t("title")}
        </p>
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
