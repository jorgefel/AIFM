"use client";

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

  const cards = [
    {
      label: "Tasa de ocupación",
      value: `${current.occupancy}%`,
      trend: <TrendBadge value={pointsChange(current.occupancy, previous.occupancy)} unit=" pts" />,
    },
    {
      label: "Reservas",
      value: String(current.reservationCount),
      trend: <TrendBadge value={pctChange(current.reservationCount, previous.reservationCount)} />,
    },
    {
      label: "Ingreso neto",
      value: formatCurrencyCompact(current.netRevenue),
      trend: <TrendBadge value={pctChange(current.netRevenue, previous.netRevenue)} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="card-surface-interactive p-6"
        >
          <p className="text-sm text-ink-muted">{card.label}</p>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">
            {isLoading ? "--" : card.value}
          </p>
          <div className="mt-2 min-h-4">{!isLoading && card.trend}</div>
        </motion.div>
      ))}
    </div>
  );
}
