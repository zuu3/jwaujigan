import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "좌우지간",
    short_name: "좌우지간",
    description: "선동 없는 정치 정보",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#191f28",
    orientation: "portrait",
    scope: "/",
    lang: "ko",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["news", "politics"],
    screenshots: [
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}
