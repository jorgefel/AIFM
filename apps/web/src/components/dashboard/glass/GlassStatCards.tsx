"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign, PieChart, TrendingUp, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface GlassStatCardsProps {
  grossIncome: number | null;
  occupancyRate: number | null;
  netProfit: number | null;
  totalExpenses: number | null;
}

export function GlassStatCards({ grossIncome, occupancyRate, netProfit, totalExpenses }: GlassStatCardsProps) {
  const { formatCurrencyCompact } = useCurrency();

  const cards = [
    {
      label: "Ingresos totales",
      value: grossIncome !== null ? formatCurrencyCompact(grossIncome) : "$0",
      icon: DollarSign,
      badgeBg: "bg-violet-100",
      badgeText: "text-violet-600",
    },
    {
      label: "Tasa de ocupación",
      value: occupancyRate !== null ? `${occupancyRate}%` : "0%",
      icon: PieChart,
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-600",
    },
    {
      label: "Ganancia neta",
      value: netProfit !== null ? formatCurrencyCompact(netProfit) : "$0",
      icon: TrendingUp,
      badgeBg: "bg-teal-100",
      badgeText: "text-teal-600",
    },
    {
      label: "Gastos totales",
      value: totalExpenses !== null ? formatCurrencyCompact(totalExpenses) : "$0",
      icon: Wallet,
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="card-surface-interactive p-4 sm:p-5"
        >
          <div className={`w-9 h-9 rounded-xl ${card.badgeBg} ${card.badgeText} flex items-center justify-center mb-3`}>
            <card.icon className="w-[18px] h-[18px]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{card.value}</p>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
