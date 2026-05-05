"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

/**
 * Wrap any element to give it a magnetic hover — the element follows the
 * cursor with 30% offset within its own bounding box, springing back to
 * neutral on leave. Use sparingly (primary CTAs only), the effect loses
 * meaning when everything bobbles.
 *
 * Renders a span by default to keep it composable around <Link>/<button>.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  /** 0–1, fraction of cursor offset applied to the element. */
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 18 });
  const springY = useSpring(y, { stiffness: 200, damping: 18 });

  if (reduce) {
    return <span className={className}>{children}</span>;
  }

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: springX, y: springY, display: "inline-block" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
