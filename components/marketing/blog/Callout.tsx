import { Info, AlertTriangle, Lightbulb, type LucideIcon } from "lucide-react";

type Variant = "info" | "warning" | "tip";

const META: Record<Variant, { icon: LucideIcon; bg: string; ring: string; fg: string }> = {
  info: {
    icon: Info,
    bg: "bg-(--color-bg-warm)",
    ring: "ring-(--color-border-strong,#D8CDB6)",
    fg: "text-(--color-text)",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-(--color-accent-soft)",
    ring: "ring-(--color-accent)/30",
    fg: "text-(--color-text)",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-(--color-success)/10",
    ring: "ring-(--color-success)/30",
    fg: "text-(--color-text)",
  },
};

/**
 * Pull-aside callout for blog posts. Three flavours: `info` (default),
 * `warning`, and `tip`. Renders as an MDX block, e.g.
 *
 *   <Callout variant="warning">Don't ship without a backup.</Callout>
 *
 * Children render inside, so paragraphs and links work as expected.
 * The first paragraph drops its top margin so it lines up with the icon.
 */
export function Callout({
  variant = "info",
  children,
}: {
  variant?: Variant;
  children: React.ReactNode;
}) {
  const { icon: Icon, bg, ring, fg } = META[variant];
  return (
    <aside
      className={`my-8 flex gap-4 rounded-[14px] p-5 ring-1 ring-inset ${bg} ${ring} ${fg} [&_p]:!mt-0 [&_p]:!text-current [&_p:not(:first-child)]:mt-3`}
    >
      <span
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-accent)"
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <div className="flex-1 text-[15px] leading-[1.6]">{children}</div>
    </aside>
  );
}
