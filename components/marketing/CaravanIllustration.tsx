"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Costa Brava-vibe caravan-illustratie voor de ClientMockup op de
 * homepage HowItWorks-sectie. Inline SVG, geen externe assets.
 *
 * - Caravan bobt subtiel (4s loop, 2px verticale shift)
 * - Zon-glow fade-in via radial gradient
 * - Horizon-lijn met dotted accent-pattern
 * - Honoreert prefers-reduced-motion (statisch)
 */
export function CaravanIllustration() {
  const reduce = useReducedMotion();
  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px]"
      style={{
        background: "linear-gradient(180deg, #FBE9D8 0%, #F4DCD4 35%, #E5D4C4 65%, #D8CDB6 100%)",
      }}
    >
      {/* Soft sun-glow */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-12 -right-8 h-48 w-48 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,222,180,0.9) 0%, rgba(255,222,180,0.3) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Sun disc */}
      <span
        aria-hidden
        className="absolute top-7 right-10 h-10 w-10 rounded-full"
        style={{
          background: "radial-gradient(circle, #FFD9A0 0%, #F4B26A 70%, #C9614F 100%)",
          boxShadow: "0 0 22px rgba(255, 200, 130, 0.5)",
        }}
      />

      {/* Distant horizon mountains (silhouette) */}
      <svg
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="mountain-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8E3F4C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6B1E2C" stopOpacity="0.05" />
          </linearGradient>
          <pattern id="ground-dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.6" fill="#8E3F4C" opacity="0.18" />
          </pattern>
        </defs>
        {/* Far mountains */}
        <path
          d="M 0 130 L 30 105 L 65 118 L 100 95 L 140 110 L 175 90 L 215 108 L 255 100 L 290 115 L 320 105 L 320 200 L 0 200 Z"
          fill="url(#mountain-grad)"
        />
        {/* Ground texture */}
        <rect x="0" y="135" width="320" height="65" fill="url(#ground-dots)" />
        {/* Horizon line */}
        <line
          x1="0"
          y1="135"
          x2="320"
          y2="135"
          stroke="#1F1B16"
          strokeWidth="0.4"
          strokeOpacity="0.18"
        />
      </svg>

      {/* Caravan — bobs gently */}
      <motion.svg
        viewBox="0 0 200 110"
        className="absolute bottom-[18%] left-1/2 h-[42%] w-auto -translate-x-1/2"
        animate={reduce ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        {/* Soft drop-shadow under caravan */}
        <ellipse cx="105" cy="98" rx="80" ry="4" fill="#1F1B16" opacity="0.12" />

        {/* Caravan body — cream with terracotta stripe */}
        <rect
          x="22"
          y="40"
          width="140"
          height="55"
          rx="14"
          fill="#FFFFFF"
          stroke="#1F1B16"
          strokeWidth="2"
        />
        {/* Roof curve highlight */}
        <path
          d="M 22 54 Q 92 42 162 54"
          stroke="#C9614F"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Side stripe */}
        <rect x="26" y="62" width="132" height="3" rx="1.5" fill="#C9614F" opacity="0.7" />

        {/* Window — left */}
        <rect
          x="36"
          y="52"
          width="44"
          height="22"
          rx="3"
          fill="#EFE8DB"
          stroke="#1F1B16"
          strokeWidth="1.4"
        />
        {/* Window cross */}
        <line x1="58" y1="52" x2="58" y2="74" stroke="#1F1B16" strokeWidth="0.8" opacity="0.4" />
        {/* Tiny curtain hint */}
        <path d="M 36 52 L 80 52 L 80 56 Z" fill="#C9614F" opacity="0.25" />

        {/* Door — right */}
        <rect
          x="98"
          y="52"
          width="28"
          height="33"
          rx="3"
          fill="#EFE8DB"
          stroke="#1F1B16"
          strokeWidth="1.4"
        />
        <circle cx="120" cy="69" r="1.6" fill="#C9614F" />

        {/* Awning — flips out from above door */}
        <path d="M 96 52 L 132 52 L 138 46 L 90 46 Z" fill="#C9614F" opacity="0.85" />
        <path d="M 90 46 L 138 46" stroke="#1F1B16" strokeWidth="1.2" opacity="0.5" />

        {/* Hitch (front) */}
        <line
          x1="22"
          y1="72"
          x2="6"
          y2="86"
          stroke="#1F1B16"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="5" cy="87" r="3" fill="#C9614F" stroke="#1F1B16" strokeWidth="1.2" />

        {/* Wheels */}
        <circle cx="50" cy="98" r="11" fill="#1F1B16" />
        <circle cx="50" cy="98" r="5" fill="#EFE8DB" />
        <circle cx="50" cy="98" r="2" fill="#1F1B16" />

        <circle cx="134" cy="98" r="11" fill="#1F1B16" />
        <circle cx="134" cy="98" r="5" fill="#EFE8DB" />
        <circle cx="134" cy="98" r="2" fill="#1F1B16" />

        {/* Antenna roof detail */}
        <line x1="160" y1="40" x2="168" y2="28" stroke="#1F1B16" strokeWidth="1.2" />
        <circle cx="168" cy="28" r="1.4" fill="#C9614F" />
      </motion.svg>

      {/* Tiny palm on the right — Costa Brava hint */}
      <svg
        viewBox="0 0 60 100"
        className="absolute right-4 bottom-[14%] h-[40%] w-auto opacity-90"
        aria-hidden
      >
        <line
          x1="30"
          y1="100"
          x2="32"
          y2="34"
          stroke="#5A3220"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Fronds */}
        {[
          { d: "M 30 32 Q 16 22 4 28", color: "#5A7A4A" },
          { d: "M 32 32 Q 46 22 58 28", color: "#5A7A4A" },
          { d: "M 30 32 Q 18 12 8 14", color: "#6B8E5C" },
          { d: "M 32 32 Q 44 12 54 14", color: "#6B8E5C" },
          { d: "M 31 32 Q 30 12 30 4", color: "#5A7A4A" },
        ].map((p, i) => (
          <path
            key={i}
            d={p.d}
            stroke={p.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        ))}
      </svg>
    </div>
  );
}
