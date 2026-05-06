"use client";

import * as React from "react";

/**
 * Adds the `is-marketing` class to <body> while this component is
 * mounted. Lets globals.css strip the body's solid cream background on
 * marketing routes so the WebGL shader behind it is actually visible,
 * while portal / admin keep their solid bg.
 */
export function BodyBackgroundToggle() {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("is-marketing");
    return () => {
      document.body.classList.remove("is-marketing");
    };
  }, []);
  return null;
}
