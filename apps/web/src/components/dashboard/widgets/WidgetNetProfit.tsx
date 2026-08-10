import React from "react";
import { Activity } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WidgetBase } from "./WidgetBase";

interface WidgetProps {
  isEditing: boolean;
  onRemove?: () => void;
}

export function WidgetNetProfit({ isEditing, onRemove }: WidgetProps) {
  const { summary, isLoading } = useDashboardData();
  const { formatCurrencyCompact } = useCurrency();

  return (
    <WidgetBase isEditing={isEditing} onRemove={onRemove} className="group flex flex-col justify-center">
      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-3 w-full">
          <div className="w-10 h-10 bg-white/5 rounded-lg"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
          <div className="h-8 bg-white/5 rounded w-3/4"></div>
        </div>
      ) : (
        <>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl group-hover:bg-emerald-400/10 transition-all pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-400/10 rounded-lg border border-emerald-400/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Ganancia Neta (Mes)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight break-words">
              {formatCurrencyCompact(summary?.net_profit || 0)}
            </h3>
          </div>
        </>
      )}
    </WidgetBase>
  );
}
