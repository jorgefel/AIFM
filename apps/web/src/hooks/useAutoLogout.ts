"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const LAST_ACTIVITY_KEY = "nomora_last_activity";
const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos (1,800,000 ms)

/**
 * Auto-logout hook — cierra la sesión cuando transcurren 30 minutos
 * de inactividad dentro de la aplicación o cuando el usuario ha estado
 * fuera de la página (pestaña en segundo plano / navegador cerrado) durante ≥ 30 minutos.
 */
export function useAutoLogout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isLoggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    try {
      await logout();
    } catch {
      // Si la llamada al backend falla, aseguramos la redirección local
    }
    router.replace("/login");
  }, [logout, router]);

  const recordActivity = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  }, []);

  useEffect(() => {
    // Si no hay usuario autenticado, no activamos el monitoreo
    if (!user) return;

    // 1. Al montar el componente (incluyendo recarga de página):
    // Verificamos si ya pasaron 30 minutos desde la última actividad registrada.
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    const now = Date.now();

    if (stored) {
      const elapsed = now - Number(stored);
      if (elapsed >= INACTIVITY_THRESHOLD_MS) {
        performLogout();
        return;
      }
    }

    // Si no ha expirado o es inicio de sesión, actualizamos timestamp de actividad
    recordActivity();

    // 2. Monitoreo de actividad dentro de la página (clicks, teclas, mouse, scroll, touch)
    let lastThrottledTime = Date.now();
    const handleUserInteraction = () => {
      const currentTime = Date.now();
      // Throttle a cada 5 segundos para no sobrecargar el almacenamiento local
      if (currentTime - lastThrottledTime > 5000) {
        lastThrottledTime = currentTime;
        recordActivity();
      }
    };

    const interactionEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { passive: true });
    });

    // 3. Cuando el usuario regresa a la pestaña tras estar fuera de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastSeen = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastSeen) {
          const elapsed = Date.now() - Number(lastSeen);
          if (elapsed >= INACTIVITY_THRESHOLD_MS) {
            performLogout();
            return;
          }
        }
        recordActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Temporizador periódico para detectar inactividad continua con la página abierta
    const intervalId = setInterval(() => {
      const lastSeen = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastSeen) {
        const elapsed = Date.now() - Number(lastSeen);
        if (elapsed >= INACTIVITY_THRESHOLD_MS) {
          performLogout();
        }
      }
    }, 15_000); // Evaluar cada 15 segundos

    return () => {
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [user, performLogout, recordActivity]);
}
