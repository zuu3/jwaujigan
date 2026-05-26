import type { MetadataRoute } from "next";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jwj.zuu3.kr";
  const supabase = createServiceRoleSupabaseClient();

  const { data: issues } = await supabase
    .from("issues")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const issueUrls: MetadataRoute.Sitemap = (issues ?? []).map((issue) => ({
    url: `${baseUrl}/issues/${issue.id}`,
    lastModified: new Date(issue.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/arena`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/issues`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...issueUrls,
  ];
}
