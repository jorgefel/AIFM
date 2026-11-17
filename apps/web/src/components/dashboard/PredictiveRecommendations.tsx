"use client";

import { useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import type { PredictiveRecommendation } from "@/types/models";

interface PredictiveRecommendationsProps {
  recommendations?: PredictiveRecommendation[];
  isLoading?: boolean;
}

export function PredictiveRecommendations({
  recommendations = [],
  isLoading = false,
}: PredictiveRecommendationsProps) {
  const displayItems = useMemo(() => {
    if (!recommendations || recommendations.length === 0) {
      return [
        {
          id: "rec-empty",
          icon: Lightbulb,
          color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
          title: "Sincroniza tus registros",
          text: "Registra tus reservas y gastos recientes para recibir recomendaciones financieras basadas en evidencia.",
          evidence: [],
        },
      ];
    }

    return recommendations.map((rec) => {
      let icon = Lightbulb;
      let color = "text-teal-400 bg-teal-500/10 border-teal-500/20";

      if (rec.severity === "critical") {
        icon = AlertTriangle;
        color = "text-rose-400 bg-rose-500/10 border-rose-500/20";
      } else if (rec.severity === "warning") {
        icon = AlertTriangle;
        color = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      } else if (rec.id.includes("positive") || rec.id.includes("trend")) {
        icon = TrendingUp;
        color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      } else if (rec.id.includes("channel")) {
        icon = ShieldCheck;
        color = "text-violet-400 bg-violet-500/10 border-violet-500/20";
      }

      return {
        id: rec.id,
        icon,
        color,
        title: rec.title,
        text: `${rec.reason} ${rec.action}`,
        evidence: rec.evidence || [],
      };
    });
  }, [recommendations]);

  return (
    <div className="card-surface flex h-full flex-col justify-between p-5 relative overflow-hidden">
      {/* Glow ambiental */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between pb-3 border-b border-line-soft">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Recomendaciones predictivas</h3>
              <p className="text-[11px] text-ink-muted">Basado en series históricas y proyecciones</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-400 border border-teal-500/20">
            Pronóstico estadístico
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2 py-3">
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface" />
            </div>
          ) : (
            displayItems.map((rec) => {
              const Icon = rec.icon;
              return (
                <div
                  key={rec.id}
                  className="group rounded-xl border border-line-soft bg-surface/50 p-3 transition-all hover:bg-surface hover:border-line"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 rounded-lg p-1.5 border ${rec.color} shrink-0`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">
                        <span>{rec.title}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                        {rec.text}
                      </p>
                      {rec.evidence && rec.evidence.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rec.evidence.map((ev, evIdx) => (
                            <span
                              key={evIdx}
                              className="rounded bg-white/5 border border-line-soft px-1.5 py-0.5 text-[9px] text-ink-muted"
                            >
                              {ev.label}:{" "}
                              <strong className="text-ink">
                                {typeof ev.value === "number"
                                  ? ev.value.toLocaleString("es-CO")
                                  : ev.value}
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-line-soft space-y-2.5">
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-300">
          💡 Entre más datos registres, más precisas y específicas serán las recomendaciones, con mejores resultados.
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>Fuente: Histórico y mercado</span>
          <a
            href="/analytics"
            className="inline-flex items-center font-medium text-violet-500 hover:text-violet-600 transition-colors"
          >
            Ver proyecciones completas
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
