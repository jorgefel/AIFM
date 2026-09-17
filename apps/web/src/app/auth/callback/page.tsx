"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeSocialLogin } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const completeAuthentication = async () => {
      try {
        const isAuthenticated = await completeSocialLogin();
        if (!isActive) return;

        if (isAuthenticated) {
          router.replace("/");
          return;
        }
      } catch {
        // The error state below gives the user a recovery path without exposing token details.
      }

      if (isActive) {
        setError(true);
      }
    };

    void completeAuthentication();

    return () => {
      isActive = false;
    };
  }, [completeSocialLogin, router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-obsidian p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <Hexagon className="mx-auto mb-4 h-10 w-10 text-purple-400" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white">No pudimos iniciar sesión</h1>
          <p className="mt-2 text-sm text-slate-400">Inténtalo de nuevo o usa tu correo y contraseña.</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian">
      <div className="flex flex-col items-center gap-4 text-slate-300">
        <Hexagon className="h-10 w-10 animate-pulse text-purple-400" aria-hidden="true" />
        <p className="text-sm">Completando inicio de sesión…</p>
      </div>
    </main>
  );
}
