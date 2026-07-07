"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-obsidian p-4 relative overflow-hidden">
      {/* Fondos borrosos */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-coral-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel max-w-md w-full p-8 flex flex-col items-center text-center relative z-10"
      >
        <div className="w-16 h-16 bg-coral-accent/10 rounded-full flex items-center justify-center mb-6 border border-coral-accent/20">
          <AlertTriangle className="w-8 h-8 text-coral-accent" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">¡Ups! Algo salió mal</h2>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          Hemos encontrado un error inesperado al procesar tu solicitud. Nuestro equipo ya ha sido notificado.
        </p>

        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-white text-obsidian px-6 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
        >
          <RefreshCcw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </motion.div>
    </div>
  );
}
