"use client";

import dynamic from "next/dynamic";

/**
 * Lazy mount for the WebGL systems globe — three.js stays out of the
 * server bundle entirely. Only ships after hydration on devices that
 * pass the fine-pointer + non-reduced-motion gate inside the component.
 */
const SystemsGlobe = dynamic(() => import("./SystemsGlobe"), { ssr: false });

export function SystemsGlobeMount({ className }: { className?: string }) {
  return <SystemsGlobe className={className} />;
}
