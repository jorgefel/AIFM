import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WidgetBase } from "./WidgetBase";



export function WidgetRecentActivity() {
  const { recentActivity, isLoading } = useDashboardData();
  const { formatCurrencyCompact } = useCurrency();

  return (
    <WidgetBase  className="flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
        <button 
          className="text-xs text-emerald-400/50 cursor-not-allowed font-medium transition-colors"
          title="El historial completo estará disponible pronto"
          disabled
        >
          Ver todo
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="w-full h-full animate-pulse flex flex-col gap-4">
            <div className="h-12 bg-white/5 rounded-xl"></div>
            <div className="h-12 bg-white/5 rounded-xl"></div>
            <div className="h-12 bg-white/5 rounded-xl"></div>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-4">No hay actividad reciente.</div>
        ) : (
          recentActivity.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  item.type === "reservation" ? "bg-emerald-500/10 text-emerald-400" : "bg-coral-accent/10 text-coral-accent"
                }`}>
                  {item.type === "reservation" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.date.toLocaleDateString()}</p>
                </div>
              </div>
              <p className={`text-sm font-bold flex-shrink-0 ${item.type === "reservation" ? "text-emerald-400" : "text-slate-300"}`}>
                {item.type === "reservation" ? "+" : "-"}{formatCurrencyCompact(item.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </WidgetBase>
  );
}
