"use client";

import dynamic from "next/dynamic";

const Caravan = dynamic(() => import("./Caravan"), { ssr: false });

export function CaravanMount({ className }: { className?: string }) {
  return <Caravan className={className} />;
}
