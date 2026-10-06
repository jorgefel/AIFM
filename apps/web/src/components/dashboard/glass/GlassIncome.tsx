"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { ArrowUpRight, DollarSign } from "lucide-react";

interface GlassIncomeProps {
  grossIncome: number | null;
  currency: string;
}

export function GlassIncome({ grossIncome, currency }: GlassIncomeProps) {
  const { formatCurrencyCompact } = useCurrency();

  return (
    <div className="card-surface-interactive flex flex-col justify-between h-full p-6 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <DollarSign className="w-[18px] h-[18px]" />
          </div>
          <h3 className="text-sm font-medium text-ink-muted">Ingresos Brutos</h3>
        </div>
        <div className="px-3 py-1 text-xs font-medium bg-surface text-ink-muted rounded-full">
          6M
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <p className="text-4xl sm:text-[2.75rem] font-bold text-ink tracking-tight">
          {grossIncome !== null ? formatCurrencyCompact(grossIncome) : "$0"}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="flex items-center gap-0.5 text-xs font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
            <ArrowUpRight className="w-3 h-3" /> {currency}
          </span>
          <span className="text-xs text-ink-muted">este período</span>
        </div>
      </div>
    </div>
  );
}
