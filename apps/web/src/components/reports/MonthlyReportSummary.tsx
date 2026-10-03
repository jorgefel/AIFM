"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, ReceiptText, TrendingUp } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useCurrency } from "@/contexts/CurrencyContext";

type Summary = { gross_income: number; total_fees: number; net_income: number; total_expenses: number; net_profit: number; occupancy_rate: number; reservation_count: number; expense_count: number };

export function MonthlyReportSummary({ propertyId, period }: { propertyId: string; period: string }) {
  const { formatCurrency } = useCurrency();
  const [year, month] = period.split("-").map(Number);
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ["report-summary", propertyId, year, month],
    queryFn: () => fetcher(`/analysis/summary?property_id=${propertyId}&year=${year}&month=${month}`),
    enabled: Boolean(propertyId && year && month),
  });
  if (isLoading) return <div className="glass-panel p-5 text-sm text-slate-500">Calculando el resumen del período…</div>;
  if (!data) return null;
  const cards = [
    { label: "Ingresos brutos", value: formatCurrency(data.gross_income), icon: <TrendingUp className="h-5 w-5 text-emerald-400" /> },
    { label: "Gastos", value: formatCurrency(data.total_expenses), icon: <ReceiptText className="h-5 w-5 text-coral-accent" /> },
    { label: "Utilidad neta", value: formatCurrency(data.net_profit), icon: <BarChart3 className={`h-5 w-5 ${data.net_profit >= 0 ? "text-teal-300" : "text-coral-accent"}`} /> },
    { label: "Ocupación", value: `${(data.occupancy_rate * 100).toFixed(0)}%`, icon: <CalendarDays className="h-5 w-5 text-violet-300" /> },
  ];
  return <section className="space-y-3"><div><h2 className="text-lg font-semibold text-white">Resumen verificable del período</h2><p className="text-sm text-slate-400">Cálculos determinísticos, antes de solicitar un análisis asistido.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="glass-panel p-4"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{card.label}</p>{card.icon}</div><p className="mt-3 text-xl font-bold text-white">{card.value}</p></div>)}</div><p className="text-xs text-slate-500">{data.reservation_count} reservas · {data.expense_count} gastos · Comisiones: {formatCurrency(data.total_fees)} · Ingreso neto: {formatCurrency(data.net_income)}</p></section>;
}
