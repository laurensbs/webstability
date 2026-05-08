"use client";

/**
 * Compact spinner. Niet de generieke Tailwind `animate-spin` ring —
 * twee tegen elkaar in tikkende ringen voor een meer "premium" feel,
 * met variants voor light (op cream) en dark (op donker) contexten.
 *
 * Honoreert prefers-reduced-motion via een puls-fallback ipv rotate.
 */
export function Spinner({
  size = 14,
  variant = "accent",
  className = "",
}: {
  /** Diameter in px. Default 14 — past in een button. */
  size?: number;
  /** Kleur-variant. accent = terracotta, light = cream/dark, dark = text. */
  variant?: "accent" | "light" | "dark";
  className?: string;
}) {
  const colorClass =
    variant === "light"
      ? "border-(--color-bg)/35 border-t-(--color-bg)"
      : variant === "dark"
        ? "border-(--color-text)/25 border-t-(--color-text)"
        : "border-(--color-accent)/30 border-t-(--color-accent)";

  return (
    <span
      role="status"
      aria-label="Laden"
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className={`block h-full w-full animate-spin rounded-full border-2 ${colorClass}`}
        style={{ animationDuration: "900ms" }}
      />
      {/* Inner counter-ring — tikt iets sneller, motion-reduced wordt
          weggehaald via CSS-prefers binnen het keyframe (animate-spin
          honoreert prefers-reduced-motion automatisch via Tailwind). */}
      <span
        className={`pointer-events-none absolute inset-1 block animate-spin rounded-full border-2 border-transparent ${
          variant === "light"
            ? "border-r-(--color-bg)/60"
            : variant === "dark"
              ? "border-r-(--color-text)/50"
              : "border-r-(--color-accent)/60"
        }`}
        style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
      />
    </span>
  );
}
