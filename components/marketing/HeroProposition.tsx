"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Layers, Zap, Sparkles } from "lucide-react";

type Line = {
  icon: "layers" | "zap" | "sparkles";
  text: string;
};

const ICONS = {
  layers: Layers,
  zap: Zap,
  sparkles: Sparkles,
} as const;

/**
 * 3-line hero proposition met staggered icon + text. Vervangt de oude
 * "Geen X. Geen Y. Geen Z." headline. Positieve copy, eigen visueel
 * anker per regel. Honoreert prefers-reduced-motion.
 *
 * Lengte-variatie tussen regels (kort/middel/lang) geeft ritme dat de
 * 3 identieke "Geen"-regels misten.
 */
export function HeroProposition({ lines }: { lines: Line[] }) {
  const reduce = useReducedMotion();
  return (
    <h1 className="mt-7 max-w-[24ch] space-y-2 text-[clamp(36px,5.5vw,68px)] leading-[1.05] tracking-[-0.02em] text-(--color-text) md:space-y-3">
      {lines.map((line, i) => {
        const Icon = ICONS[line.icon];
        return (
          <motion.span
            key={i}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.1 + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex items-baseline gap-3 md:gap-4"
          >
            <span
              aria-hidden
              className="relative top-[0.05em] inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center self-center rounded-[0.22em] bg-(--color-accent-soft) text-(--color-accent)"
              style={{ width: "1.05em", height: "1.05em" }}
            >
              <Icon strokeWidth={2} className="h-[55%] w-[55%]" aria-hidden />
            </span>
            <span>{line.text}</span>
          </motion.span>
        );
      })}
    </h1>
  );
}
