"use client";

import { Sparkles } from "lucide-react";

interface GlassAiDecisionsProps {
  onExplore: () => void;
}

export function GlassAiDecisions({ onExplore }: GlassAiDecisionsProps) {
  return (
    <div className="flex flex-col justify-between h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
      {/* Subtle internal glow */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-white mb-3">
          Decisiones con IA
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Optimiza tu portafolio con insights de IA basados en el mercado local.
        </p>
      </div>

      <button
        onClick={onExplore}
        className="mt-6 relative z-10 flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
      >
        <Sparkles className="w-4 h-4" />
        Explorar Reporte IA
      </button>
    </div>
  );
}
