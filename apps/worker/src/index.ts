import { jwtVerify } from "jose";

export interface Env {
  JWT_SECRET: string;
  ORIGIN_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const originUrl = env.ORIGIN_URL || "http://localhost:8000";

    // Reconstruct the URL for the backend
    const targetUrl = new URL(url.pathname + url.search, originUrl);
    const originRequest = new Request(targetUrl.toString(), request);

    // Only cache GET requests to specific endpoints
    if (request.method !== "GET") {
      return fetch(originRequest);
    }

    const isCacheableEndpoint =
      url.pathname.startsWith("/api/v1/users/me") ||
      url.pathname.startsWith("/api/v1/properties/");

    if (!isCacheableEndpoint) {
      return fetch(originRequest);
    }

    // 1. Extract JWT from cookies
    const cookieHeader = request.headers.get("Cookie");
    let token = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith("access_token=")) {
          token = cookie.split("=")[1];
          break;
        }
      }
    }

    // If no token, pass through to let origin handle the 401
    if (!token) {
      return fetch(originRequest);
    }

    let userId: string;

    try {
      // 2. Verify the JWT signature using `jose` with HS256.
      // This is CRITICAL to prevent Cache Poisoning.
      // If we didn't verify the signature, an attacker could forge a token with someone else's user ID
      // and potentially view their cached data or poison their cache.
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      if (!payload.sub) {
        throw new Error("Missing sub claim");
      }
      userId = payload.sub;
    } catch (err) {
      // Invalid token -> pass to origin so it triggers 401 & refresh flow
      return fetch(originRequest);
    }

    // 3. Build cache key tied to the user
    const cacheKey = new Request(`${targetUrl.toString()}::user::${userId}`, {
      headers: request.headers,
    });

    const cache = caches.default;

    // 4. Try to serve from cache
    let response = await cache.match(cacheKey);

    if (!response) {
      // Cache miss -> fetch from origin
      response = await fetch(originRequest);

      // Only cache successful responses (200 OK)
      if (response.status === 200) {
        // Clone the response because we need to modify headers and put it in cache
        response = new Response(response.body, response);
        // Cache for 2 minutes (120 seconds) as requested
        response.headers.set("Cache-Control", "private, max-age=120");
        
        // Cache the response asynchronously
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    }

    return response;
  },
};
