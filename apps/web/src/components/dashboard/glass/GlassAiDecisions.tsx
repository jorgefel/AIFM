"use client";

import { Sparkles } from "lucide-react";

interface GlassAiDecisionsProps {
  onExplore: () => void;
}

export function GlassAiDecisions({ onExplore }: GlassAiDecisionsProps) {
  return (
    <div className="flex flex-col justify-between h-full p-6 rounded-[1.25rem] bg-gradient-to-br from-violet-600 to-violet-800 shadow-[0_20px_40px_-16px_rgba(124,92,252,0.5)] relative overflow-hidden">
      {/* Subtle internal glow */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Decisiones con IA
        </h3>
        <p className="text-sm text-violet-100/80 leading-relaxed">
          Optimiza tu portafolio con insights basados en el mercado local.
        </p>
      </div>

      <button
        onClick={onExplore}
        className="mt-6 relative z-10 flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-violet-700 bg-white hover:bg-violet-50 transition-all shadow-lg"
      >
        <Sparkles className="w-4 h-4" />
        Explorar Reporte IA
      </button>
    </div>
  );
}
