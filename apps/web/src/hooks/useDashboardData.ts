import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";

export type PerformanceRange = "1M" | "3M" | "6M" | "1A";

const performanceRangeParam: Record<PerformanceRange, "1m" | "3m" | "6m" | "1y"> = {
  "1M": "1m",
  "3M": "3m",
  "6M": "6m",
  "1A": "1y",
};

export function useDashboardData(performanceRange: PerformanceRange = "6M") {
  // ── Properties via React Query (shared with useProperties, single request) ──
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // ── Current date params ──
  const dateParams = useMemo(() => {
    const date = new Date();
    return {
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1,
    };
  }, []);

  // ── Consolidated Dashboard Data via React Query ──
  // One single endpoint to fetch summary, chart data, and recent activity
  const dashboardCurrency = properties[0]?.currency;
  const dashboardPath = `/analysis/portfolio-dashboard?year=${dateParams.currentYear}&month=${dateParams.currentMonth}&range=${performanceRangeParam[performanceRange]}${dashboardCurrency ? `&currency=${dashboardCurrency}` : ""}`;

  const { data: dashboardData = null, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["portfolio-dashboard", dateParams.currentYear, dateParams.currentMonth, performanceRange, dashboardCurrency],
    queryFn: () => fetcher(dashboardPath!),
    enabled: true,
    staleTime: 1000 * 30, // 30 seconds
  });

  const summary = dashboardData?.summary || null;
  
  // Format chart data for Recharts
  const chartData = useMemo(() => {
    if (!dashboardData?.chart_data) return [];
    
    // The backend returns it in chronological order from oldest to newest
    return dashboardData.chart_data.map((m: any) => {
      if (m.day != null) {
        const date = new Date(m.year, m.month - 1, m.day);
        return {
          name: String(m.day),
          tooltipLabel: date.toLocaleDateString("es", { day: "numeric", month: "short" }),
          Ingresos: m.gross_income ?? 0,
          Gastos: m.total_expenses ?? 0,
        };
      }

      const d = new Date(m.year, m.month - 1, 1);
      return {
        name: d.toLocaleString("es", { month: "short" }),
        tooltipLabel: d.toLocaleString("es", { month: "short" }),
        Ingresos: m.gross_income ?? 0,
        Gastos: m.total_expenses ?? 0,
      };
    });
  }, [dashboardData]);

  // Format recent activity
  const recentActivity = useMemo(() => {
    if (!dashboardData?.recent_activity) return [];
    return dashboardData.recent_activity.map((a: any) => ({
      ...a,
      date: new Date(a.date)
    }));
  }, [dashboardData]);

  const isLoading = isDashboardLoading;

  return {
    properties,
    summary,
    chartData,
    recentActivity,
    propertySummaries: dashboardData?.property_summaries ?? [],
    isLoading,
  };
}
