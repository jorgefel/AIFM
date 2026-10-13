"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthPoint } from "@/lib/metrics";
import type { MonthForecast } from "@/types/models";
import { TrendBadge } from "./TrendBadge";

interface RevenueTrendChartProps {
  data: MonthPoint[];
  total: number;
  change: number | null;
  isLoading: boolean;
  forecast?: MonthForecast[];
}

export function RevenueTrendChart({ data, total, change, isLoading, forecast }: RevenueTrendChartProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const theme = useChartTheme();

  // Si hay pronósticos, unificamos los puntos históricos con los pronosticados
  const chartPoints = [...data.map((p) => ({ ...p, isForecast: false, projected: undefined as number | undefined }))];
  if (forecast && forecast.length > 0 && chartPoints.length > 0) {
    // Puente: el último mes histórico también inicia la línea proyectada para continuidad visual
    const lastPoint = chartPoints[chartPoints.length - 1];
    lastPoint.projected = lastPoint.revenue;

    const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    forecast.forEach((f) => {
      const parts = f.month.split("-");
      const mIdx = parseInt(parts[1], 10) - 1;
      const label = monthNames[mIdx] ?? f.month;
      chartPoints.push({
        key: f.month,
        label: `${label} (IA)`,
        revenue: undefined as any,
        occupancy: 0,
        projected: f.projected_gross_income,
        isForecast: true,
      } as any);
    });
  }

  const hasData = chartPoints.some((point) => (point.revenue && point.revenue > 0) || (point.projected && point.projected > 0));

  return (
    <section aria-labelledby="revenue-chart-title" className="card-surface flex h-full flex-col p-6">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h2 id="revenue-chart-title" className="text-sm font-medium text-ink-muted">
            Ingresos
          </h2>
          <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatCurrency(total)}</p>
          <div className="mt-1">
            <TrendBadge value={change} />
          </div>
        </div>
        {forecast && forecast.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-xs font-semibold text-pink-400">
            <Sparkles className="h-3 w-3" />
            <span>+3M Proyectados IA</span>
          </div>
        )}
      </header>

      <div className="min-h-[240px] flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="projectedRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke={theme.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrencyCompact(value)}
              />
              <Tooltip
                cursor={{ stroke: theme.axis, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload.find((p) => p.value !== undefined && p.value !== null);
                  if (!item) return null;
                  const isProjected = item.dataKey === "projected" && (item.payload as any).isForecast;
                  return (
                    <div className="rounded-xl border border-line-soft bg-card px-4 py-3 shadow-xl">
                      <p className="mb-1 text-xs font-medium text-ink-muted">
                        {label} {isProjected ? "(Estimación)" : ""}
                      </p>
                      <p className={`text-sm font-semibold ${isProjected ? "text-pink-400" : "text-ink"}`}>
                        {formatCurrency(Number(item.value))}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7C5CFC"
                strokeWidth={2.5}
                fill="url(#portfolioRevenue)"
                dot={false}
                activeDot={{ r: 5, fill: "#7C5CFC", stroke: theme.dotStroke, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#EC4899"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fill="url(#projectedRevenue)"
                dot={{ r: 3, fill: "#EC4899" }}
                activeDot={{ r: 5, fill: "#EC4899", stroke: theme.dotStroke, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line-soft bg-surface text-sm text-ink-muted">
            Aún no hay ingresos registrados en estos meses.
          </div>
        )}
      </div>
    </section>
  );
}

