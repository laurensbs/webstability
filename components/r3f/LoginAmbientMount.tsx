"use client";

import dynamic from "next/dynamic";

const LoginAmbient = dynamic(() => import("./LoginAmbient"), { ssr: false });

export function LoginAmbientMount({ className }: { className?: string }) {
  return <LoginAmbient className={className} />;
}
