"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, ReceiptText, Wallet } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useCurrency } from "@/contexts/CurrencyContext";

type Overview = {
  summary: {
    gross_income: number;
    total_fees: number;
    net_income: number;
    total_expenses: number;
    net_profit: number;
    reservation_count: number;
    expense_count: number;
  };
  expense_breakdown: { category: string; amount: number }[];
};

const categoryLabels: Record<string, string> = {
  cleaning: "Limpieza", maintenance: "Mantenimiento", supplies: "Insumos", utilities: "Servicios",
  platform_fees: "Comisiones", taxes: "Impuestos", insurance: "Seguros", marketing: "Marketing", other: "Otros",
};

export function FinanceOverview({ propertyId, year, month }: { propertyId?: string; year: number; month: number }) {
  const { formatCurrency } = useCurrency();
  const isAll = !propertyId || propertyId === "all";
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["finance-overview", isAll ? "all" : propertyId, year, month],
    queryFn: () => {
      const url = isAll
        ? `/analysis/finance-overview?year=${year}&month=${month}`
        : `/analysis/finance-overview?property_id=${propertyId}&year=${year}&month=${month}`;
      return fetcher(url);
    },
    enabled: true,
  });
  if (isLoading) return <div className="glass-panel p-5 text-sm text-slate-500">Calculando resumen financiero…</div>;
  if (!data) return null;
  const maxCategory = Math.max(...data.expense_breakdown.map((item) => item.amount), 1);
  const cards = [
    { label: "Ingresos netos", value: data.summary.net_income, icon: <ArrowUpRight className="h-5 w-5" />, color: "text-emerald-400" },
    { label: "Gastos", value: data.summary.total_expenses, icon: <ArrowDownRight className="h-5 w-5" />, color: "text-coral-accent" },
    { label: "Utilidad neta", value: data.summary.net_profit, icon: <Wallet className="h-5 w-5" />, color: data.summary.net_profit >= 0 ? "text-teal-300" : "text-coral-accent" },
  ];
  return <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">{cards.map((card) => <div key={card.label} className="glass-panel p-5"><div className="flex items-start justify-between"><p className="text-sm text-slate-400">{card.label}</p><span className={card.color}>{card.icon}</span></div><p className={`mt-3 text-2xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p><p className="mt-1 text-xs text-slate-500">{data.summary.reservation_count} reservas · {data.summary.expense_count} gastos</p></div>)}</div>
    <div className="glass-panel p-5"><div className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-teal-400" /><h2 className="font-semibold text-white">Distribución de gastos</h2></div>{data.expense_breakdown.length ? <div className="mt-5 space-y-3">{data.expense_breakdown.map((item) => <div key={item.category}><div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-300">{categoryLabels[item.category] ?? item.category}</span><span className="text-slate-400">{formatCurrency(item.amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${(item.amount / maxCategory) * 100}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No hay gastos registrados para este período.</p>}</div>
  </section>;
}
