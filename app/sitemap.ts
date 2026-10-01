import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/config/public-env";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

/**
 * Static pages plus every approved listing. Reads through the anon-scoped
 * client, so RLS guarantees only public listings can ever appear here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/properties`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/locations`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/safety`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const listings: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${base}/properties/${p.id}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...listings];
}
