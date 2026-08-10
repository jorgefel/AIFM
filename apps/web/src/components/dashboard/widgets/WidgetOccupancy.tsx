import React from "react";
import { Users } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WidgetBase } from "./WidgetBase";

interface WidgetProps {
  isEditing: boolean;
  onRemove?: () => void;
}

export function WidgetOccupancy({ isEditing, onRemove }: WidgetProps) {
  const { summary, isLoading } = useDashboardData();

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
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Tasa de Ocupación</p>
            <h3 className="text-3xl font-bold text-white tracking-tight truncate">
              {`${((summary?.occupancy_rate || 0) * 100).toFixed(1)}%`}
            </h3>
          </div>
        </>
      )}
    </WidgetBase>
  );
}
