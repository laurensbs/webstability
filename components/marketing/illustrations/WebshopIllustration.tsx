"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Webshop-illustratie: een mini browser-window met een 2x2 product-grid
 * en een terracotta "checkout"-pill die slide't naar binnen. Suggereert
 * "snelle, meertalige site of webshop."
 */
export function WebshopIllustration() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" aria-hidden>
      {/* Browser-frame */}
      <rect
        x="14"
        y="14"
        width="172"
        height="102"
        rx="8"
        fill="#FFFFFF"
        stroke="#1F1B16"
        strokeWidth="1.5"
      />
      {/* Tab-bar */}
      <rect x="14" y="14" width="172" height="14" rx="8" fill="#EFE8DB" />
      <rect x="14" y="22" width="172" height="6" fill="#EFE8DB" />
      <circle cx="22" cy="21" r="1.6" fill="#C9614F" />
      <circle cx="28" cy="21" r="1.6" fill="#F4DCD4" />
      <circle cx="34" cy="21" r="1.6" fill="#5A7A4A" opacity="0.5" />
      <line x1="14" y1="28" x2="186" y2="28" stroke="#1F1B16" strokeWidth="1" opacity="0.15" />

      {/* Productie-grid 2x2 */}
      {[
        { x: 26, y: 38, fill: "#FBE9D8", delay: 0.1 },
        { x: 80, y: 38, fill: "#F4DCD4", delay: 0.2 },
        { x: 26, y: 70, fill: "#DCE8E7", delay: 0.3 },
        { x: 80, y: 70, fill: "#FBE9D8", delay: 0.4 },
      ].map((p, i) => (
        <motion.g
          key={i}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect
            x={p.x}
            y={p.y}
            width="46"
            height="26"
            rx="3"
            fill={p.fill}
            stroke="#1F1B16"
            strokeOpacity="0.2"
          />
          <rect
            x={p.x + 4}
            y={p.y + 18}
            width="20"
            height="3"
            rx="1.5"
            fill="#1F1B16"
            opacity="0.3"
          />
          <rect x={p.x + 28} y={p.y + 18} width="14" height="3" rx="1.5" fill="#C9614F" />
        </motion.g>
      ))}

      {/* Checkout-pill (terracotta) — slide't in van rechts */}
      <motion.g
        initial={reduce ? false : { x: 30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x="138" y="38" width="38" height="58" rx="6" fill="#C9614F" />
        <rect x="143" y="46" width="28" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.6" />
        <rect x="143" y="52" width="20" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.4" />
        <rect x="143" y="84" width="28" height="6" rx="3" fill="#FFFFFF" />
        <text
          x="157"
          y="89"
          fontFamily="ui-monospace, monospace"
          fontSize="4.5"
          fontWeight="600"
          fill="#C9614F"
          textAnchor="middle"
        >
          €
        </text>
      </motion.g>
    </svg>
  );
}
