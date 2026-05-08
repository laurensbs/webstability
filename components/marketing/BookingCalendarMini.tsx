"use client";

import { motion, useReducedMotion } from "motion/react";

type Strings = {
  weekdays: [string, string, string, string, string, string, string];
  monthLabel: string;
};

/**
 * Mini 14-dag grid voor OwnerMockup. Toont juli 12—25 met de 7 boekings-
 * nachten (14—21) gemarkeerd in accent. Geboekte cellen verschijnen
 * sequentieel (50ms stagger) om een "data flowt binnen"-gevoel te geven.
 */
export function BookingCalendarMini({ strings }: { strings: Strings }) {
  const reduce = useReducedMotion();
  const days = Array.from({ length: 14 }, (_, i) => 12 + i);
  const bookedStart = 14;
  const bookedEnd = 21;

  return (
    <div className="rounded-[12px] border border-(--color-border) bg-(--color-bg-warm)/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {strings.monthLabel}
        </span>
        <span className="font-mono text-[10px] text-(--color-accent)">7 nachten</span>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {strings.weekdays.map((d, i) => (
          <span
            key={`wd-${i}`}
            className="text-center font-mono text-[9px] tracking-wider text-(--color-muted) uppercase"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const booked = day >= bookedStart && day <= bookedEnd;
          const isStart = day === bookedStart;
          const isEnd = day === bookedEnd;
          return (
            <motion.div
              key={day}
              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.3,
                delay: reduce ? 0 : i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={[
                "relative flex aspect-square items-center justify-center text-[11px] font-medium",
                booked
                  ? "bg-(--color-accent) text-white"
                  : "bg-(--color-surface) text-(--color-muted)",
                isStart ? "rounded-l-md" : "",
                isEnd ? "rounded-r-md" : "",
                !booked ? "rounded-md border border-(--color-border)" : "",
              ].join(" ")}
            >
              {day}
              {isStart ? (
                <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-(--color-wine)" />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
