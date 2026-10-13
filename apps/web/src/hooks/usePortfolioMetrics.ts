import { useMemo } from "react";
import { computeMetrics, getPeriodRanges, monthlySeries, type PeriodId } from "@/lib/metrics";
import { usePortfolio } from "./usePortfolio";

export function usePortfolioMetrics(period: PeriodId) {
  const portfolio = usePortfolio();
  const { properties, reservations } = portfolio;

  const metrics = useMemo(() => {
    const ranges = getPeriodRanges(period);
    const futureMonths = period === "next_quarter" ? 3 : period === "next_month" ? 2 : 1;
    return {
      current: computeMetrics(reservations, properties, ranges.current),
      previous: computeMetrics(reservations, properties, ranges.previous),
      series: monthlySeries(reservations, properties, period === "year" ? 12 : 6, new Date(), futureMonths),
    };
  }, [period, reservations, properties]);

  return { ...portfolio, ...metrics };
}
