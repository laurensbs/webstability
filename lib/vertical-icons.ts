// Slug → lucide-icon-map voor de vier panelen. Bewust apart van
// lib/verticals.ts: dat is server-side data (slugs + prijzen), dit is
// een UI-concern die client-componenten (mega-menu, mobile-nav) importeren.
// Eén plek zodat een nieuw paneel maar op twee plekken bijgewerkt hoeft:
// lib/verticals.ts (de slug + messages + prijs) en hier (het icoon).

import { CalendarClock, LayoutDashboard, LayoutGrid, Wrench, type LucideIcon } from "lucide-react";
import { VERTICAL_SLUGS } from "@/lib/verticals";

export const VERTICAL_ICONS: Record<(typeof VERTICAL_SLUGS)[number], LucideIcon> = {
  "verhuur-boekingssysteem": CalendarClock,
  "klantportaal-laten-bouwen": LayoutDashboard,
  "admin-systeem-op-maat": LayoutGrid,
  "reparatie-portaal": Wrench,
};
