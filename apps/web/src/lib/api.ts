import axios from "axios";
import { hasSessionHint, isPublicAuthRoute } from "./session";

// Usamos URL relativa por defecto para que pase por el Proxy de Next.js (rewrites en next.config.ts)
// y evitemos bloqueos de cookies de terceros.
const API_URL = process.env.NEXT_PUBLIC_PROXY_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

// Variables para manejo de concurrencia en refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const shouldAttemptRefresh = () => {
  if (!hasSessionHint()) {
    return false;
  }
  if (isPublicAuthRoute()) {
    return false;
  }
  return true;
};

// Interceptor de Respuestas (Refresh Token Logic)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      shouldAttemptRefresh()
    ) {
      if (isRefreshing) {
        // Encolar peticiones mientras se hace el refresh
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentamos obtener un nuevo access token usando el refresh token HttpOnly
        await api.post("/auth/refresh");
        isRefreshing = false;
        processQueue(null, "ok");
        
        // Reintentamos la petición original
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Si falla (token revocado o expirado), redirigimos al login
        if (typeof window !== "undefined" && !isPublicAuthRoute()) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
