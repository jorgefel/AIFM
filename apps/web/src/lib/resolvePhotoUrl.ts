/**
 * Resolves a property photo URL.
 * If the URL is a relative local upload path (/uploads/...),
 * prefixes it with /api/v1 so Next.js proxies it to the FastAPI backend.
 */
export function resolvePhotoUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) {
    return `/api/v1${url}`;
  }
  return url;
}
