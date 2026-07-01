import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stoopsale.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "hourly", priority: 1 },
    { url: `${site}/map`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site}/spot`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Active public listings (RLS already limits to ACTIVE + not hidden).
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sale_listings")
      .select("id, updated_at")
      .eq("status", "ACTIVE")
      .eq("is_hidden", false)
      .gt("ends_at", new Date().toISOString())
      .limit(1000);
    const listingPages: MetadataRoute.Sitemap = (data ?? []).map((l) => ({
      url: `${site}/listings/${l.id}`,
      lastModified: new Date(l.updated_at),
      changeFrequency: "daily",
      priority: 0.8,
    }));
    return [...staticPages, ...listingPages];
  } catch {
    return staticPages;
  }
}
