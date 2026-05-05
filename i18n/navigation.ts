import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next's navigation that respect localized
// pathnames defined in `routing`. Always use these in app code, never the
// bare next/link / next/navigation primitives, otherwise translated slugs
// won't be resolved.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
