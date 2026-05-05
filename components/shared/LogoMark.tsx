"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Geometric "ws" mark — three terracotta lines that converge.
 * Renders as a 24x24 SVG. On hover the lines animate in sequentially.
 */
export function LogoMark({
  size = 22,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const shouldAnimate = animate && !reduce;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      whileHover={shouldAnimate ? "hover" : undefined}
      initial="rest"
    >
      {/* Outer rounded square */}
      <motion.rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{
          rest: { pathLength: 1, opacity: 1 },
          hover: { rotate: 90, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{ transformOrigin: "12px 12px" }}
      />
      {/* Three converging lines forming a "w" silhouette */}
      <motion.path
        d="M 6 8 L 9 16 L 12 10"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          rest: { pathLength: 1, opacity: 1 },
          hover: { pathLength: [0, 1], transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        }}
      />
      <motion.path
        d="M 12 10 L 15 16 L 18 8"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          rest: { pathLength: 1, opacity: 1 },
          hover: {
            pathLength: [0, 1],
            transition: { duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
          },
        }}
      />
    </motion.svg>
  );
}
