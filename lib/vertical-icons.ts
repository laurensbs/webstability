// Slug → lucide-icon-map voor de zes verticals. Bewust apart van
// lib/verticals.ts: dat is server-side data (slugs + config-flags), dit is
// een UI-concern die client-componenten (mega-menu, mobile-nav) importeren.
// Eén plek zodat een nieuwe vertical maar op twee plekken bijgewerkt hoeft:
// lib/verticals.ts (de slug + messages) en hier (het icoon).

import {
  CalendarClock,
  LayoutDashboard,
  Globe,
  ShoppingBag,
  LayoutGrid,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { VERTICAL_SLUGS } from "@/lib/verticals";

export const VERTICAL_ICONS: Record<(typeof VERTICAL_SLUGS)[number], LucideIcon> = {
  "verhuur-boekingssysteem": CalendarClock,
  "klantportaal-laten-bouwen": LayoutDashboard,
  "website-laten-maken": Globe,
  "webshop-laten-maken": ShoppingBag,
  "admin-systeem-op-maat": LayoutGrid,
  "reparatie-portaal": Wrench,
};
