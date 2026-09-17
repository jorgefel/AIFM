import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/register", "/opengraph-image"],
      disallow: ["/income", "/expenses", "/properties", "/reports", "/settings"],
    },
    sitemap: "/sitemap.xml",
  };
}
