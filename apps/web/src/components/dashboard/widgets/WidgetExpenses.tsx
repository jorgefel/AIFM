import React from "react";
import { ArrowDownRight } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WidgetBase } from "./WidgetBase";

interface WidgetProps {
  isEditing: boolean;
  onRemove?: () => void;
}

export function WidgetExpenses({ isEditing, onRemove }: WidgetProps) {
  const { summary, isLoading } = useDashboardData();
  const { formatCurrency } = useCurrency();

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
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-coral-accent/5 rounded-full blur-2xl group-hover:bg-coral-accent/10 transition-all pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-obsidian-light rounded-lg border border-white/5">
              <ArrowDownRight className="w-5 h-5 text-coral-accent" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Gastos Totales (Mes)</p>
            <h3 className="text-3xl font-bold text-slate-200 tracking-tight truncate">
              {formatCurrency(summary?.total_expenses || 0)}
            </h3>
          </div>
        </>
      )}
    </WidgetBase>
  );
}
