"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Heading that reveals word-by-word with a 60ms stagger as it scrolls
 * into view. Words wrapped with single asterisks (e.g. "*Het systeem*")
 * are rendered as accent italics.
 *
 * Usage:
 *   <AnimatedHeading as="h1">Niet de zoveelste website. *Het systeem* onder je bedrijf.</AnimatedHeading>
 */
type Tag = "h1" | "h2" | "h3";

const EASE = [0.22, 1, 0.36, 1] as const;

export function AnimatedHeading({
  children,
  as = "h1",
  className,
  delay = 0,
}: {
  children: string;
  as?: Tag;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = as as "h1";

  // Tokenize: keep asterisk-marked words intact as a single token so they
  // animate as one unit (an accent phrase like "*Het systeem*" stays grouped).
  const tokens = React.useMemo(() => parseAccentMarkers(children), [children]);

  if (reduce) {
    return (
      <Tag className={className}>
        {tokens.map((tok, i) => (
          <React.Fragment key={i}>
            {tok.accent ? <em>{tok.text}</em> : tok.text}
            {i < tokens.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      {tokens.map((tok, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: delay + i * 0.06, ease: EASE }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {tok.accent ? <em>{tok.text}</em> : tok.text}
        </motion.span>
      ))}
    </Tag>
  );
}

/** Splits "Niet de zoveelste *Het systeem* onder je bedrijf." into tokens
 *  where bracketed phrases are kept whole and marked as accent. */
function parseAccentMarkers(input: string): Array<{ text: string; accent: boolean }> {
  const tokens: Array<{ text: string; accent: boolean }> = [];
  // Greedy: split first by *...* phrases, then split outer text on whitespace.
  const re = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      const before = input.slice(lastIndex, m.index).trim();
      if (before) before.split(/\s+/).forEach((w) => tokens.push({ text: w, accent: false }));
    }
    tokens.push({ text: m[1]!.trim(), accent: true });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < input.length) {
    const after = input.slice(lastIndex).trim();
    if (after) after.split(/\s+/).forEach((w) => tokens.push({ text: w, accent: false }));
  }
  if (tokens.length === 0) {
    // No accent markers — split everything on whitespace.
    input
      .trim()
      .split(/\s+/)
      .forEach((w) => tokens.push({ text: w, accent: false }));
  }
  return tokens;
}
