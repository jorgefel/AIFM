import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nomoraweb.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/login", "/register"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));
}