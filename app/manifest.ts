import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Webstability",
    short_name: "Webstability",
    description: "Het systeem onder je bedrijf — software, hosting, support uit één hand.",
    start_url: "/",
    display: "minimal-ui",
    background_color: "#F5F0E8",
    theme_color: "#C9614F",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
