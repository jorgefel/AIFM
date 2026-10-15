import { useMemo } from "react";
import {
  computeMetrics,
  getDateFilterRanges,
  getChartSeries,
  getDefaultDateFilter,
  type DateFilter,
} from "@/lib/metrics";
import { usePortfolio } from "./usePortfolio";

export function usePortfolioMetrics(filter: DateFilter = getDefaultDateFilter()) {
  const portfolio = usePortfolio();
  const { properties, reservations } = portfolio;

  const metrics = useMemo(() => {
    const ranges = getDateFilterRanges(filter);
    return {
      current: computeMetrics(reservations, properties, ranges.current),
      previous: computeMetrics(reservations, properties, ranges.previous),
      series: getChartSeries(reservations, properties, filter),
    };
  }, [filter, reservations, properties]);

  return { ...portfolio, ...metrics };
}
