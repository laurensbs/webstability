"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Marketing nav link that paints a terracotta underline when its route
 * is active. Matches the mockup's `.nav-links a.active::after` rule.
 */
export function NavLink({ href, children }: { href: Href; children: React.ReactNode }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : ((href as { pathname?: string }).pathname ?? "");
  const active = target === "/" ? pathname === "/" : pathname.startsWith(target);

  return (
    <Link
      href={href}
      className={`relative transition-colors ${
        active ? "text-(--color-text)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute right-0 -bottom-1.5 left-0 h-[2px] rounded-full bg-(--color-accent)"
        />
      ) : null}
    </Link>
  );
}
