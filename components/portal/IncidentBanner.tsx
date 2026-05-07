"use client";

import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";

type Strings = {
  title: string; // "Storing actief op {project}"
  since: string; // "sinds {time}"
  cta: string;
};

/**
 * Wijn-rode banner bovenaan portal-dashboard wanneer een project van
 * de klant een open incident heeft. Klikbaar naar /portal/monitoring
 * of de project-detail. Niet dismissable — moet zichtbaar blijven tot
 * de cron resolved.
 */
export function IncidentBanner({
  projectName,
  startedAt,
  href,
  strings,
  dateFmt,
}: {
  projectName: string;
  startedAt: Date;
  href: string;
  strings: Strings;
  dateFmt: Intl.DateTimeFormat;
}) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="block rounded-xl border border-(--color-wine)/40 bg-(--color-wine)/5 p-4 transition-colors hover:bg-(--color-wine)/10"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-wine)" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-(--color-wine)">
            {strings.title.replace("{project}", projectName)}
          </p>
          <p className="mt-0.5 text-[12px] text-(--color-muted)">
            {strings.since.replace("{time}", dateFmt.format(startedAt))} · {strings.cta} →
          </p>
        </div>
      </div>
    </motion.a>
  );
}
