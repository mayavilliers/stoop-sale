import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stoopsale.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/my-listings", "/saved", "/api/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
