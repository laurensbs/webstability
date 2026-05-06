"use client";

import dynamic from "next/dynamic";

/**
 * Client wrapper that lazy-loads the WebGL shader background. ssr:false
 * keeps three.js out of the server bundle entirely; the chunk only
 * downloads after hydration on devices that pass the fine-pointer +
 * non-reduced-motion check inside the component.
 */
const WarmShaderBackground = dynamic(() => import("./WarmShaderBackground"), {
  ssr: false,
});

export function AmbientCanvas() {
  return <WarmShaderBackground />;
}
