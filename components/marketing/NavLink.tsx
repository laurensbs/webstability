"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Marketing nav link — strak en clean. Active link is volle text-kleur,
 * inactive is muted. Geen accent-onderlijn, geen pill — minder ruis,
 * meer Stripe-stijl rust.
 */
export function NavLink({ href, children }: { href: Href; children: React.ReactNode }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : ((href as { pathname?: string }).pathname ?? "");
  const active = target === "/" ? pathname === "/" : pathname.startsWith(target);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) ${
        active ? "text-(--color-text)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {children}
    </Link>
  );
}
