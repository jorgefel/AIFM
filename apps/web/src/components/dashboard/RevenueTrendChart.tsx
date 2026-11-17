"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

  // Si hay pronósticos, unificamos los puntos históricos/actuales con los proyectados
  const chartPoints = [
    ...data.map((p) => ({
      ...p,
      isForecast: false,
      realAmount: p.revenue || 0,
      projectedAmount: 0,
      minAmount: undefined as number | undefined,
      maxAmount: undefined as number | undefined,
    })),
  ];

  if (forecast && forecast.length > 0) {
    const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    forecast.forEach((f) => {
      const parts = f.month.split("-");
      const mIdx = parseInt(parts[1], 10) - 1;
      const baseLabel = monthNames[mIdx] ?? f.month;
      const existing = chartPoints.find((p) => p.label.toLowerCase() === baseLabel.toLowerCase());
      if (existing) {
        existing.projectedAmount = Math.max(existing.realAmount || 0, f.projected_gross_income);
        existing.minAmount = f.gross_income_min;
        existing.maxAmount = f.gross_income_max;
        return;
      }
      chartPoints.push({
        key: f.month,
        label: `${baseLabel}*`,
        revenue: 0,
        occupancy: 0,
        realAmount: 0,
        projectedAmount: f.projected_gross_income,
        minAmount: f.gross_income_min,
        maxAmount: f.gross_income_max,
        isForecast: true,
      } as any);
    });
  }

  const hasData = chartPoints.some(
    (point) => (point.realAmount && point.realAmount > 0) || (point.projectedAmount && point.projectedAmount > 0)
  );

  return (
    <section aria-labelledby="revenue-chart-title" className="card-surface flex h-full flex-col p-6">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h2 id="revenue-chart-title" className="text-sm font-medium text-ink-muted">
            Ingresos
          </h2>
          <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatCurrency(total)}</p>
          <div className="mt-1 flex items-center gap-2">
            <TrendBadge value={change} />
            <div className="flex items-center gap-3 text-[11px] text-ink-muted ml-2">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#433075]" /> Real
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#A58CF4]" /> Proyectado
              </span>
            </div>
          </div>
        </div>
        {forecast && forecast.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400">
            <Sparkles className="h-3 w-3" />
            <span>Pronóstico estadístico</span>
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
            <BarChart data={chartPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                cursor={{ fill: "rgba(165, 140, 244, 0.08)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  const isProj = item.isForecast;
                  const displayValue = isProj ? item.projectedAmount : item.realAmount;
                  return (
                    <div className="rounded-xl border border-line-soft bg-card px-4 py-3 shadow-xl space-y-1">
                      <p className="text-xs font-medium text-ink-muted">
                        {label} {isProj ? "(Pronóstico estadístico)" : "(Histórico real)"}
                      </p>
                      <p className={`text-sm font-bold ${isProj ? "text-[#A58CF4]" : "text-ink"}`}>
                        {formatCurrency(Number(displayValue))}
                      </p>
                      {isProj && item.minAmount !== undefined && item.maxAmount !== undefined && (
                        <p className="text-[10px] text-ink-muted pt-1 border-t border-line-soft">
                          Rango estimado: {formatCurrencyCompact(item.minAmount)} – {formatCurrencyCompact(item.maxAmount)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="realAmount" name="Real" radius={[6, 6, 0, 0]} maxBarSize={38}>
                {chartPoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isForecast ? "#A58CF4" : "#433075"}
                  />
                ))}
              </Bar>
            </BarChart>
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

