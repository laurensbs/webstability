import * as React from "react";

/**
 * Renders a string with `*word*` accent markers as JSX with `<em>` for the
 * marked phrases. Use this anywhere a heading would otherwise just print
 * the raw asterisks (i.e. wherever AnimatedHeading isn't used).
 *
 * This intentionally doesn't animate — pair it with AnimatedHeading for
 * scroll-driven word stagger.
 */
export function MarkupText({ children }: { children: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(children)) !== null) {
    if (m.index > lastIndex) {
      parts.push(children.slice(lastIndex, m.index));
    }
    parts.push(<em key={key++}>{m[1]}</em>);
    lastIndex = re.lastIndex;
  }
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }
  return <>{parts}</>;
}
