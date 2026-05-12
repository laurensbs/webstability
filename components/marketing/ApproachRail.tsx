"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

type Step = { kicker: string; title: string; body: string; meta: string };

/**
 * Progress-rail voor de werkwijze-sectie. Vier nodes op een horizontale
 * lijn (lg+) of verticaal (mobile). De connectie-lijn tekent zichzelf
 * bij scroll-in, nodes pop'en in met staggered delay zodat het oog
 * van links naar rechts (of boven naar onder) wordt geleid.
 *
 * Eind-node (live) krijgt een check-icoon ipv nummer — markeert het
 * "doel" van de rail.
 */
export function ApproachRail({ steps }: { steps: Step[] }) {
  const reduce = useReducedMotion();
  const lastIdx = steps.length - 1;

  return (
    <div className="relative">
      {/* HORIZONTALE rail (lg+) ============================================ */}
      <div className="hidden lg:block">
        {/* SVG connectie-lijn — pathLength stroke-draw bij scroll-in */}
        <svg
          aria-hidden
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
          className="absolute top-[22px] right-[12.5%] left-[12.5%] h-px"
        >
          <motion.line
            x1="0"
            y1="0.5"
            x2="100"
            y2="0.5"
            stroke="rgba(245,240,232,0.25)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <ol className="relative grid grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.li
              key={step.kicker}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Node step={step} isLast={i === lastIdx} reduce={reduce ?? false} />
            </motion.li>
          ))}
        </ol>
      </div>

      {/* VERTICALE rail (< lg) ============================================ */}
      <div className="lg:hidden">
        <svg
          aria-hidden
          viewBox="0 1 1 100"
          preserveAspectRatio="none"
          className="absolute top-[22px] bottom-[22px] left-[22px] w-px"
        >
          <motion.line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100"
            stroke="rgba(245,240,232,0.25)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <ol className="relative space-y-10">
          {steps.map((step, i) => (
            <motion.li
              key={step.kicker}
              initial={reduce ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex gap-5"
            >
              {/* Vertical layout: node link, content rechts */}
              <div className="shrink-0">
                <NodeCircle kicker={step.kicker} isLast={i === lastIdx} reduce={reduce ?? false} />
              </div>
              <div className="min-w-0 flex-1">
                <NodeContent step={step} />
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Node({ step, isLast, reduce }: { step: Step; isLast: boolean; reduce: boolean }) {
  return (
    <div>
      <NodeCircle kicker={step.kicker} isLast={isLast} reduce={reduce} />
      <div className="mt-6">
        <NodeContent step={step} />
      </div>
    </div>
  );
}

function NodeCircle({
  kicker,
  isLast,
  reduce,
}: {
  kicker: string;
  isLast: boolean;
  reduce: boolean;
}) {
  // Eind-node = check-icoon in terracotta-fill (= "live behaald").
  // Tussen-nodes = cream-circle met serif-italic nummer in terracotta.
  if (isLast) {
    return (
      <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--color-accent) text-white shadow-[0_0_0_4px_rgba(201,97,79,0.18)]">
        {/* Pulserende ring — alleen wanneer motion mag */}
        {!reduce ? (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-(--color-accent)"
            style={{ animation: "wb-soft-pulse 2.4s ease-out infinite" }}
          />
        ) : null}
        <Check className="relative h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--color-bg)/25 bg-(--color-text) font-serif text-[15px] text-(--color-accent) italic shadow-[0_0_0_4px_rgba(31,27,22,0.4)]">
      {kicker}
    </span>
  );
}

function NodeContent({ step }: { step: Step }) {
  return (
    <>
      <p className="font-mono text-[10px] tracking-widest text-(--color-bg)/55 uppercase">
        {"// stap "}
        {step.kicker}
      </p>
      <h3 className="mt-2 text-[20px] leading-tight text-(--color-bg)">{step.title}</h3>
      <p className="mt-3 text-[14px] leading-[1.55] text-(--color-bg)/70">{step.body}</p>
      <p className="mt-4 inline-flex items-center rounded-full border border-(--color-bg)/15 bg-(--color-bg)/[0.05] px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-accent) uppercase">
        {step.meta}
      </p>
    </>
  );
}
