"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "@/i18n/navigation";

/**
 * Lichte fade+lift op route-change binnen portal/admin. Reduced-motion →
 * geen animatie, gewoon de content. `key={pathname}` zorgt dat motion remount
 * op navigatie zodat de in-animatie opnieuw speelt.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <div key={pathname}>{children}</div>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
