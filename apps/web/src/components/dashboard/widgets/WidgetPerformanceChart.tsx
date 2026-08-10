import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WidgetBase } from "./WidgetBase";

interface WidgetProps {
  isEditing: boolean;
  onRemove?: () => void;
}

export function WidgetPerformanceChart({ isEditing, onRemove }: WidgetProps) {
  const { chartData, isLoading } = useDashboardData();
  const { formatCurrencyCompact } = useCurrency();

  return (
    <WidgetBase isEditing={isEditing} onRemove={onRemove} className="flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Rendimiento (Últimos 6 Meses)</h3>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Ingresos</div>
          <div className="flex items-center gap-1 ml-2"><div className="w-2 h-2 rounded-full bg-coral-accent"></div> Gastos</div>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-white/5 rounded-xl"></div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7b72" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff7b72" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrencyCompact(value)} domain={[0, 'auto']} allowDecimals={false} />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" />
              <Area type="monotone" dataKey="Gastos" stroke="#ff7b72" fillOpacity={1} fill="url(#colorGastos)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm border border-white/5 border-dashed rounded-xl bg-obsidian-light/20">
            No hay datos suficientes
          </div>
        )}
      </div>
    </WidgetBase>
  );
}
