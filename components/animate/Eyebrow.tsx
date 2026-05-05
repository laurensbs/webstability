import { ScrambleText } from "@/components/animate/ScrambleText";

/**
 * Standard "// label" eyebrow used above section headings. Single source
 * of truth for the styling — JetBrains Mono, 12px, terracotta, scramble
 * decode on scroll-in.
 */
export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={`font-mono text-[12px] tracking-[0.1em] text-(--color-accent) uppercase ${className ?? ""}`}
    >
      <ScrambleText text={`// ${children}`} />
    </p>
  );
}
