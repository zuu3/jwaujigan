import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jwj.zuu3.kr";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/arena", "/issues", "/community"],
      disallow: ["/api/", "/mypage", "/onboarding"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
