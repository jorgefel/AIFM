"use client";

import { CalendarCheck, DollarSign, PieChart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { pctChange, pointsChange, type Metrics } from "@/lib/metrics";
import { TrendBadge } from "./TrendBadge";

interface PortfolioStatCardsProps {
  current: Metrics;
  previous: Metrics;
  isLoading: boolean;
}

export function PortfolioStatCards({ current, previous, isLoading }: PortfolioStatCardsProps) {
  const { formatCurrencyCompact } = useCurrency();
  const placeholder = "--";

  const cards = [
    {
      label: "Ingresos totales",
      value: formatCurrencyCompact(current.revenue),
      trend: <TrendBadge value={pctChange(current.revenue, previous.revenue)} />,
      icon: DollarSign,
      badge: "bg-violet-100 text-violet-600",
    },
    {
      label: "Tasa de ocupación",
      value: `${current.occupancy}%`,
      trend: <TrendBadge value={pointsChange(current.occupancy, previous.occupancy)} unit=" pts" />,
      icon: PieChart,
      badge: "bg-blue-100 text-blue-600",
    },
    {
      label: "Reservas",
      value: String(current.reservationCount),
      trend: <TrendBadge value={pctChange(current.reservationCount, previous.reservationCount)} />,
      icon: CalendarCheck,
      badge: "bg-amber-100 text-amber-600",
    },
    {
      label: "Ingreso neto",
      value: formatCurrencyCompact(current.netRevenue),
      trend: <TrendBadge value={pctChange(current.netRevenue, previous.netRevenue)} />,
      icon: TrendingUp,
      badge: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="card-surface-interactive p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">{card.label}</p>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.badge}`}>
              <card.icon className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {isLoading ? placeholder : card.value}
          </p>
          <div className="mt-2 min-h-4">{!isLoading && card.trend}</div>
        </motion.div>
      ))}
    </div>
  );
}
