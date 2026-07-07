import axios from "axios";

// Determine base URL, fallback to localhost for dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

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
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        // Intentamos obtener un nuevo access token usando el refresh token HttpOnly
        await api.post("/auth/refresh");
        // Si es exitoso, reintentamos la petición original
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla (token revocado o expirado), redirigimos al login
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
