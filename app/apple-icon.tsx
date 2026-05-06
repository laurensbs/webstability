import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS "Add to Home Screen" icon. Same mark as the browser favicon but
 * 180x180 with proper rounded-square padding so it looks correct on
 * the iOS springboard.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F5F0E8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
        <path
          d="M 6 8 L 9 16 L 12 10"
          stroke="#C9614F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 12 10 L 15 16 L 18 8"
          stroke="#C9614F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { ...size },
  );
}
