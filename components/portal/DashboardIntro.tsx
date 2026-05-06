"use client";

import { motion, useReducedMotion } from "motion/react";

export function DashboardIntro({
  greeting,
  firstName,
  status,
  subStatus,
}: {
  greeting: string;
  firstName: string;
  status: string;
  /** Optional context line (mono, dim) — e.g. "laatst ingelogd: 2 dagen geleden". */
  subStatus?: string;
}) {
  const reduce = useReducedMotion();
  // Capitalize first letter so "laurens" → "Laurens" but a name that's
  // already capitalized stays untouched. Defensive against empty strings.
  const displayName =
    firstName.length > 0 ? firstName[0]!.toUpperCase() + firstName.slice(1) : firstName;
  const letters = Array.from(displayName);

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      <h1 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl">
        {greeting},{" "}
        {reduce ? (
          <em className="inline-block">{displayName}</em>
        ) : (
          <span className="inline-block whitespace-nowrap" aria-label={displayName}>
            {letters.map((char, i) => (
              <motion.em
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
                aria-hidden
              >
                {char}
              </motion.em>
            ))}
          </span>
        )}
        .
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="text-(--color-muted)"
      >
        {status}
      </motion.p>
      {subStatus ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="font-mono text-xs tracking-wide text-(--color-muted)/80"
        >
          {"// "}
          {subStatus}
        </motion.p>
      ) : null}
    </motion.header>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } },
      }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </motion.section>
  );
}

export function StatItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
