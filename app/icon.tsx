import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser favicon — the Webstability "w" mark on cream. Generated at
 * build time by next/og so we don't ship a static asset that could
 * drift from the brand mark in components/shared/LogoMark.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F5F0E8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M 6 8 L 9 16 L 12 10"
          stroke="#C9614F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 12 10 L 15 16 L 18 8"
          stroke="#C9614F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { ...size },
  );
}
