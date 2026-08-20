"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

interface GlassPerformanceChartProps {
  chartData: any[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-black/5 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-ink-muted font-medium mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-ink-muted">{entry.name}:</span>
          <span className="text-xs font-semibold text-ink">${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function GlassPerformanceChart({ chartData, isLoading }: GlassPerformanceChartProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="card-surface-interactive flex flex-col h-full p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-medium text-ink-muted">Rendimiento Portafolio</h3>
        <div className="flex gap-1.5">
          {["1M", "3M", "6M", "1A"].map((range, i) => (
            <button
              key={range}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                i === 2
                  ? "bg-violet-600 text-white"
                  : "bg-surface text-ink-muted hover:bg-violet-50 hover:text-violet-600"
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
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glassGradientIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="glassGradientGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                stroke="#9C9CAF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9C9CAF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,31,0.06)" vertical={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Ingresos"
                stroke="#7C5CFC"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#glassGradientIngresos)"
                dot={false}
                activeDot={{ r: 5, fill: "#7C5CFC", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Gastos"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#glassGradientGastos)"
                dot={false}
                activeDot={{ r: 4, fill: "#F43F5E", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm border border-black/5 border-dashed rounded-xl bg-surface">
            No hay datos suficientes para mostrar el gráfico.
          </div>
        )}
      </div>
    </div>
  );
}
