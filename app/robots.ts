import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/config/public-env";

/** Public marketplace pages are crawlable; account areas and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/owner", "/admin", "/notifications", "/api/", "/auth/"],
      },
    ],
    sitemap: `${publicEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
