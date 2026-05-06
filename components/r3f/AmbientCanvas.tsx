"use client";

/**
 * Vervangt de WebGL WarmShaderBackground door een statische SVG-noise
 * via feTurbulence. Geen three, geen GPU-werk, geen iOS jank — wel
 * dezelfde papier-textuur warmte achter de marketing-site.
 *
 * De `body.is-marketing` body-class blijft gevoed door
 * BodyBackgroundToggle (die geen R3F nodig heeft) zodat dezelfde
 * cream-bg-onderdrukking blijft werken.
 */
export function AmbientCanvas() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--color-bg)" }}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="wb-paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="6" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0.85 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#wb-paper-noise)" />
      </svg>
      {/* Zachte cream-warm gradient strookje achter de noise voor diepte */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,220,212,0.4), transparent 60%)",
        }}
      />
    </div>
  );
}
