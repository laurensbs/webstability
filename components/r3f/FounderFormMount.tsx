"use client";

import dynamic from "next/dynamic";

const FounderForm = dynamic(() => import("./FounderForm"), { ssr: false });

export function FounderFormMount({ className }: { className?: string }) {
  return <FounderForm className={className} />;
}
