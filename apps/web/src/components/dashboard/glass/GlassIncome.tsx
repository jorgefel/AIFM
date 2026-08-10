"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface GlassIncomeProps {
  grossIncome: number | null;
  currency: string;
}

export function GlassIncome({ grossIncome, currency }: GlassIncomeProps) {
  const { formatCurrencyCompact } = useCurrency();
  
  return (
    <div className="flex flex-col justify-between h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
      {/* Soft Glow internally */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-lg font-medium text-slate-300">Ingresos Brutos</h3>
        <div className="px-3 py-1 text-xs font-medium bg-white/10 text-white rounded-full">
          6M
        </div>
      </div>
      
      <div className="mt-8 relative z-10">
        <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight flex items-baseline gap-2">
          <span className="text-2xl text-slate-400">$</span>
          {grossIncome !== null ? formatCurrencyCompact(grossIncome).replace('$', '').trim() : "0"}
        </p>
        <p className="text-slate-400 mt-2 font-medium tracking-wide">
          {currency}
        </p>
      </div>
    </div>
  );
}
