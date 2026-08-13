"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { PerformanceRange } from "@/hooks/useDashboardData";

interface GlassPerformanceChartProps {
  chartData: any[];
  isLoading: boolean;
  selectedRange: PerformanceRange;
  onRangeChange: (range: PerformanceRange) => void;
}

const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const tooltipLabel = payload[0]?.payload?.tooltipLabel ?? label;
  return (
    <div className="bg-[#1A1A28] border border-white/10 rounded-xl px-4 py-3 shadow-xl backdrop-blur-lg">
      <p className="text-xs text-slate-400 font-medium mb-1.5">{tooltipLabel}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-300">{entry.name}:</span>
          <span className="text-xs font-semibold text-white">{formatCurrency(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
};

export function GlassPerformanceChart({ chartData, isLoading, selectedRange, onRangeChange }: GlassPerformanceChartProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const isDailyRange = selectedRange === "1M";

  const formatXAxisTick = (value: string) => {
    if (!isDailyRange) return value;

    const day = Number(value);
    return day === 1 || day % 5 === 0 ? String(day) : "";
  };

  return (
    <div className="flex flex-col h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
      {/* Internal glow */}
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-medium text-slate-300">Rendimiento Portafolio</h3>
        <div className="flex gap-1.5">
          {(["1M", "3M", "6M", "1A"] as PerformanceRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedRange === range
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="glassGradientIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="glassGradientGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tickFormatter={formatXAxisTick}
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={88}
                tickFormatter={(value) => formatCurrencyCompact(value)}
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
              <Area
                type="monotone"
                dataKey="Ingresos"
                stroke="#A78BFA"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#glassGradientIngresos)"
                dot={false}
                activeDot={{ r: 5, fill: "#A78BFA", stroke: "#1A1A28", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Gastos"
                stroke="#EC4899"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#glassGradientGastos)"
                dot={false}
                activeDot={{ r: 4, fill: "#EC4899", stroke: "#1A1A28", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm border border-white/5 border-dashed rounded-xl bg-white/[0.02]">
            No hay datos suficientes para mostrar el gráfico.
          </div>
        )}
      </div>
    </div>
  );
}
