"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { MonthForecast, PredictiveRecommendation } from "@/types/models";

interface PredictiveRecommendationsProps {
  recommendations?: PredictiveRecommendation[];
  forecast?: MonthForecast[];
  isLoading?: boolean;
}

export function PredictiveRecommendations({
  recommendations = [],
  forecast = [],
  isLoading = false,
}: PredictiveRecommendationsProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const nextMonth = forecast && forecast.length > 0 ? forecast[0] : null;

  const nextMonthLabel = useMemo(() => {
    if (!nextMonth?.month) return "";
    const parts = nextMonth.month.split("-");
    const mIdx = parseInt(parts[1], 10) - 1;
    const names = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${names[mIdx] ?? parts[1]} ${parts[0]}`;
  }, [nextMonth]);

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

  const [expandedId, setExpandedId] = useState<string | null>(null);

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

        {/* Resumen destacado del próximo mes */}
        {nextMonth && (
          <div className="mt-3 rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-surface/60 to-transparent p-3">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-line-soft">
              <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Próximo mes: <span className="text-ink">{nextMonthLabel}</span>
              </span>
              <span className="text-[10px] text-ink-muted">
                {nextMonth.confidence_level === "high"
                  ? "Alta confianza"
                  : nextMonth.confidence_level === "medium"
                  ? "Confianza media"
                  : "Estimación"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-ink-muted">Ingreso est.</p>
                <p className="text-xs sm:text-sm font-bold text-ink">
                  {formatCurrency(nextMonth.projected_gross_income)}
                </p>
                <p className="text-[9px] text-ink-muted truncate">
                  {formatCurrencyCompact(nextMonth.gross_income_min)} - {formatCurrencyCompact(nextMonth.gross_income_max)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted">Ganancia neta</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400">
                  {formatCurrency(nextMonth.projected_net_profit)}
                </p>
                <p className="text-[9px] text-ink-muted truncate">
                  Min: {formatCurrencyCompact(nextMonth.net_profit_min)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted">Reservas est.</p>
                <p className="text-xs sm:text-sm font-bold text-ink">
                  ~{nextMonth.projected_reservations ?? 0}
                </p>
                <p className="text-[9px] text-ink-muted truncate">
                  {nextMonth.booked_reservations ? `${nextMonth.booked_reservations} confirmadas` : "0 confirmadas"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de recomendaciones con acordeón desplegable */}
        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-10 w-full animate-pulse rounded-xl bg-surface" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-surface" />
            </div>
          ) : (
            displayItems.map((rec) => {
              const Icon = rec.icon;
              const isExpanded = expandedId === rec.id;
              return (
                <div
                  key={rec.id}
                  className="rounded-xl border border-line-soft bg-surface/50 transition-all hover:bg-surface hover:border-line overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                    className="w-full flex items-center justify-between p-2.5 text-left gap-2 focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`rounded-lg p-1.5 border ${rec.color} shrink-0`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-semibold text-ink truncate">
                        {rec.title}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-ink-muted transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180 text-violet-400" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-line-soft text-[11px] leading-relaxed text-ink-muted animate-fadeIn">
                      <p>{rec.text}</p>
                      {rec.evidence && rec.evidence.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-line-soft space-y-2">
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
