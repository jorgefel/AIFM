"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const HIDDEN_AT_KEY = "nomora_hidden_at";
const INACTIVITY_THRESHOLD_MS = 300_000; // 5 minutes

/**
 * Auto-logout hook — closes the session when the user has been away
 * (tab hidden / browser closed) for ≥ 5 minutes.
 *
 * Uses the Page Visibility API instead of `setInterval` because timers
 * are aggressively throttled by browsers when the tab is in the background.
 */
export function useAutoLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  const hiddenAtRef = useRef<number | null>(null);

  const performLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Even if the server call fails, ensure we redirect
    }
    router.replace("/login");
  }, [logout, router]);

  useEffect(() => {
    // ── On mount: check if a persisted hidden timestamp exists ──
    // This covers the case where the user closed/reloaded the tab
    // while it was hidden.
    const persisted = localStorage.getItem(HIDDEN_AT_KEY);
    if (persisted) {
      const elapsed = Date.now() - Number(persisted);
      localStorage.removeItem(HIDDEN_AT_KEY);
      if (elapsed >= INACTIVITY_THRESHOLD_MS) {
        performLogout();
        return; // skip setting up listeners — we're logging out
      }
    }

    // ── visibilitychange handler ──
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else {
        // Tab became visible again
        if (hiddenAtRef.current !== null) {
          const elapsed = Date.now() - hiddenAtRef.current;
          hiddenAtRef.current = null;
          if (elapsed >= INACTIVITY_THRESHOLD_MS) {
            performLogout();
          }
        }
      }
    };

    // ── beforeunload handler ──
    // Persist the hidden-at timestamp so we can check it on next mount.
    const handleBeforeUnload = () => {
      if (hiddenAtRef.current !== null) {
        localStorage.setItem(HIDDEN_AT_KEY, String(hiddenAtRef.current));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Clean up persisted timestamp if unmounting normally
      localStorage.removeItem(HIDDEN_AT_KEY);
    };
  }, [performLogout]);
}
