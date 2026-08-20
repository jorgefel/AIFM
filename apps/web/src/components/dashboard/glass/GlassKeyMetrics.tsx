"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { ArrowUpRight } from "lucide-react";

interface GlassKeyMetricsProps {
  netProfit: number | null;
  occupancyRate: number | null;
  totalExpenses: number | null;
}

export function GlassKeyMetrics({ netProfit, occupancyRate, totalExpenses }: GlassKeyMetricsProps) {
  const { formatCurrencyCompact } = useCurrency();

  return (
    <div className="flex flex-col h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-medium text-slate-300">Métricas Clave</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full transition-colors">
          Ver todas
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
        {/* Metric 1: Ganancia Neta */}
        <div className="flex flex-col justify-center items-center bg-[#181822] border border-white/5 rounded-[2rem] p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {netProfit !== null ? formatCurrencyCompact(netProfit) : "$0"}
          </p>
          <p className="text-xs font-medium text-teal-400 mt-1 mb-2">+0.0%</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Ganancia<br/>Neta (Mes)</p>
        </div>

        {/* Metric 2: Tasa Ocupación */}
        <div className="flex flex-col justify-center items-center bg-[#181822] border border-white/5 rounded-[2rem] p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {occupancyRate !== null ? occupancyRate : "0"}%
          </p>
          <p className="text-xs font-medium text-teal-400 mt-1 mb-2">+0.0%</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Tasa<br/>Ocupación</p>
        </div>

        {/* Metric 3: Gastos Totales */}
        <div className="flex flex-col justify-center items-center bg-[#181822] border border-white/5 rounded-[2rem] p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {totalExpenses !== null ? formatCurrencyCompact(totalExpenses) : "$0"}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1 mb-2">-</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Gastos<br/>Totales</p>
        </div>

        {/* Metric 4: ROI Proyectado */}
        <div className="flex flex-col justify-center items-center bg-[#181822] border border-white/5 rounded-[2rem] p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            N/A
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1 mb-2">-</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">ROI<br/>Proyectado</p>
        </div>
      </div>
    </div>
  );
}
