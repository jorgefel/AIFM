import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  isPublic?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  isPublic = false,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: isPublic ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: isPublic
      ? {
          title: `${title} | AIFM`,
          description,
          url: path,
          siteName: "AIFM",
          type: "website",
          images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AIFM" }],
        }
      : undefined,
  };
}
