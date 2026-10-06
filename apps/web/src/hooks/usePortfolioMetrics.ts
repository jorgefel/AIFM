import { useMemo } from "react";
import { computeMetrics, getPeriodRanges, monthlySeries, type PeriodId } from "@/lib/metrics";
import { usePortfolio } from "./usePortfolio";

export function usePortfolioMetrics(period: PeriodId) {
  const portfolio = usePortfolio();
  const { properties, reservations } = portfolio;

  const metrics = useMemo(() => {
    const ranges = getPeriodRanges(period);
    return {
      current: computeMetrics(reservations, properties, ranges.current),
      previous: computeMetrics(reservations, properties, ranges.previous),
      series: monthlySeries(reservations, properties, period === "year" ? 12 : 6),
    };
  }, [period, reservations, properties]);

  return { ...portfolio, ...metrics };
}
