"use client";

/**
 * Vervangt de WebGL pulsing-dots-globe door een 2D pulse-grid. Toont
 * concreter "wat draait" dan een geroteerde puntenwolk — elk dotje
 * staat voor een service, met een staggered keyframe-pulse zodat het
 * voelt als systemen die ademen i.p.v. een generieke screensaver.
 */
export function SystemsGlobeMount({ className }: { className?: string }) {
  // 5x5 grid; even patroon zodat het niet te druk wordt.
  const cells = Array.from({ length: 25 });
  return (
    <div className={className} aria-hidden>
      <div className="grid h-full w-full grid-cols-5 grid-rows-5 place-items-center gap-2">
        {cells.map((_, i) => {
          const delay = (i * 137) % 1000; // pseudo-staggered
          return (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-(--color-accent)/35"
              style={{
                animation: `wb-fade-in 2400ms ease-in-out ${delay}ms infinite alternate`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
