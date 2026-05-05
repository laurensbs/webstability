"use client";

import { motion } from "motion/react";

export function AuthCard({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string;
  subtitle: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md space-y-8"
    >
      <div className="space-y-3 text-center">
        <p className="text-2xl font-extrabold tracking-tight">
          webstability<span className="text-(--color-accent)">.</span>
        </p>
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        <p className="text-(--color-muted)">{subtitle}</p>
      </div>
      {children ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6 shadow-sm"
        >
          {children}
        </motion.div>
      ) : null}
      {hint ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm text-(--color-muted)"
        >
          {hint}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
