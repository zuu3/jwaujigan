import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jwaujigan.com";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/arena", "/issues", "/community"],
      disallow: ["/api/", "/mypage", "/onboarding"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
