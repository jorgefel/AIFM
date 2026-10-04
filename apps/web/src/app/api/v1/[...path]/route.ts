import { NextRequest } from "next/server";

function resolveApiOrigin(): string {
  const configured = process.env.BACKEND_API_ORIGIN?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8000/api/v1";
  }
  return "https://aifm.onrender.com/api/v1";
}

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const apiOrigin = resolveApiOrigin();
  const trailingSlash = request.nextUrl.pathname.endsWith("/") ? "/" : "";
  const url = `${apiOrigin}/${path.join("/")}${trailingSlash}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);

  // These belong to the browser-to-Vercel hop and must be regenerated for
  // Vercel-to-Render. The Cookie header remains, so authentication is proxied.
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");

  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  // If upstream returns a redirect pointing to the backend API origin,
  // rewrite the Location header to route through this proxy (/api/v1/...)
  // so the client browser never bypasses the proxy and drops session cookies.
  const location = responseHeaders.get("location");
  if (location) {
    try {
      const locUrl = new URL(location);
      const originUrl = new URL(apiOrigin);
      if (locUrl.origin === originUrl.origin && locUrl.pathname.startsWith(originUrl.pathname)) {
        const proxiedPath = locUrl.pathname.slice(originUrl.pathname.length);
        responseHeaders.set("location", `/api/v1${proxiedPath}${locUrl.search}`);
      }
    } catch {
      // Ignore invalid or relative URLs
    }
  }

  // Preserve each authentication cookie individually. Combining Set-Cookie
  // headers would cause browsers to retain only part of the session.
  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie?.call(upstream.headers) ?? [];
  if (cookies.length) {
    responseHeaders.delete("set-cookie");
    cookies.forEach((cookie) => responseHeaders.append("set-cookie", cookie));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
