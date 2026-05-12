/**
 * Twee decoratieve halo-blobs in de hoeken van een `relative isolate overflow-
 * hidden`-container — de meest-voorkomende ambient-achtergrond op de site
 * (footer, login, verify, Cal-popup). `pointer-events-none`, dus klikt nergens
 * doorheen. Op `pointer: coarse` (touch) worden de filters in globals.css al
 * gedimd, dus geen aparte mobiele variant nodig.
 *
 * Gebruik in een container met `overflow-hidden`:
 *   <AmbientHalos variant="accent-teal" />
 */
const VARIANTS = {
  "accent-wine": {
    a: "bg-(--color-accent)",
    b: "bg-(--color-wine)",
    opA: "opacity-35",
    opB: "opacity-45",
  },
  "accent-teal": {
    a: "bg-(--color-accent)",
    b: "bg-(--color-teal)",
    opA: "opacity-40",
    opB: "opacity-50",
  },
} as const;

export function AmbientHalos({
  variant = "accent-teal",
  size = 420,
}: {
  variant?: keyof typeof VARIANTS;
  /** Diameter van beide blobs in px. */
  size?: number;
}) {
  const v = VARIANTS[variant];
  const dim = { width: size, height: size };
  return (
    <>
      <div
        aria-hidden
        style={dim}
        className={`wb-soft-halo pointer-events-none absolute -top-32 -left-32 rounded-full blur-3xl ${v.a} ${v.opA}`}
      />
      <div
        aria-hidden
        style={dim}
        className={`wb-soft-halo pointer-events-none absolute -right-32 -bottom-32 rounded-full blur-3xl ${v.b} ${v.opB}`}
      />
    </>
  );
}
