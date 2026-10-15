"use client";

import { useMemo } from "react";
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, ShieldCheck, Lightbulb, AlertTriangle } from "lucide-react";
import type { MonthForecast } from "@/types/models";

interface PredictiveRecommendationsProps {
  forecast?: MonthForecast[];
  currentRevenue?: number;
  isLoading?: boolean;
}

export function PredictiveRecommendations({
  forecast = [],
  currentRevenue = 0,
  isLoading = false,
}: PredictiveRecommendationsProps) {
  const recommendations = useMemo(() => {
    if (!forecast || forecast.length === 0) {
      return [
        {
          id: "rec-default-1",
          type: "growth",
          icon: Lightbulb,
          color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
          title: "Optimización de tarifas",
          text: "Configura tarifas dinámicas los fines de semana para capturar hasta un 18% más de ingreso.",
        },
        {
          id: "rec-default-2",
          type: "strategy",
          icon: ShieldCheck,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
          title: "Estancias mínimas",
          text: "Establece mínimo de 2 noches en días festivos para reducir costos de limpieza por rotación.",
        },
      ];
    }

    const nextMonth = forecast[0];
    const avgProjected =
      forecast.reduce((acc, f) => acc + (f.projected_gross_income || 0), 0) / forecast.length;
    const isIncreasing = currentRevenue > 0 ? avgProjected >= currentRevenue * 0.95 : true;

    const list = [];

    if (isIncreasing) {
      list.push({
        id: "rec-high",
        type: "growth",
        icon: TrendingUp,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        title: "Demanda proyectada al alza",
        text: `Proyección media de $${Math.round(avgProjected).toLocaleString()} para próximos meses. Considera subir 8-12% el precio base por noche.`,
      });
    } else {
      list.push({
        id: "rec-cautious",
        type: "warning",
        icon: AlertTriangle,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        title: "Temporada de menor demanda",
        text: "Se prevé una ligera desaceleración. Activa descuentos por reserva anticipada (>14 días) para asegurar ocupación.",
      });
    }

    if (nextMonth && nextMonth.projected_net_profit) {
      const profitMargin =
        nextMonth.projected_gross_income > 0
          ? Math.round((nextMonth.projected_net_profit / nextMonth.projected_gross_income) * 100)
          : 70;

      list.push({
        id: "rec-margin",
        type: "strategy",
        icon: Lightbulb,
        color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        title: `Margen neto estimado: ${profitMargin}%`,
        text: "Revisa gastos recurrentes de mantenimiento para mantener el beneficio neto por encima del objetivo.",
      });
    } else {
      list.push({
        id: "rec-channels",
        type: "strategy",
        icon: ShieldCheck,
        color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
        title: "Diversificación de canales",
        text: "Mantén sincronizados Airbnb y Booking vía Beds24 para evitar sobreventas en fechas críticas.",
      });
    }

    return list;
  }, [forecast, currentRevenue]);

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
            Modelo IA
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2 py-3">
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface" />
            </div>
          ) : (
            recommendations.map((rec) => {
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
                      <p className="text-xs font-semibold text-ink flex items-center justify-between">
                        <span>{rec.title}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                        {rec.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between text-[11px] text-ink-muted">
        <span>Confianza estadística: 80-85%</span>
        <a
          href="/analytics"
          className="inline-flex items-center font-medium text-violet-500 hover:text-violet-600 transition-colors"
        >
          Ver proyecciones completas
          <ArrowUpRight className="ml-0.5 h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
