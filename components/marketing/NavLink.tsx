"use client";

import { motion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * Marketing nav link with a wijn-rode underline op de active route. De
 * underline is geanimeerd via `layoutId` — bij navigatie glijdt 'ie
 * smooth naar de volgende active link i.p.v. abrupt te springen.
 */
export function NavLink({ href, children }: { href: Href; children: React.ReactNode }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : ((href as { pathname?: string }).pathname ?? "");
  const active = target === "/" ? pathname === "/" : pathname.startsWith(target);

  return (
    <Link
      href={href}
      className={`relative rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) ${
        active ? "text-(--color-text)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {children}
      {active ? (
        <motion.span
          layoutId="nav-active-underline"
          aria-hidden
          className="absolute right-0 -bottom-1.5 left-0 h-[2px] rounded-full bg-(--color-wine)"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
    </Link>
  );
}
