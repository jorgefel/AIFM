"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthPoint } from "@/lib/metrics";
import { TrendBadge } from "./TrendBadge";

interface RevenueTrendChartProps {
  data: MonthPoint[];
  total: number;
  change: number | null;
  isLoading: boolean;
}

export function RevenueTrendChart({ data, total, change, isLoading }: RevenueTrendChartProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const theme = useChartTheme();
  const hasData = data.some((point) => point.revenue > 0);

  return (
    <section aria-labelledby="revenue-chart-title" className="card-surface flex h-full flex-col p-6">
      <header className="mb-4">
        <h2 id="revenue-chart-title" className="text-sm font-medium text-ink-muted">
          Ingresos
        </h2>
        <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatCurrency(total)}</p>
        <div className="mt-1">
          <TrendBadge value={change} />
        </div>
      </header>

      <div className="min-h-[240px] flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
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
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-line-soft bg-card px-4 py-3 shadow-xl">
                      <p className="mb-1 text-xs font-medium text-ink-muted">{label}</p>
                      <p className="text-sm font-semibold text-ink">
                        {formatCurrency(Number(payload[0].value))}
                      </p>
                    </div>
                  ) : null
                }
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
