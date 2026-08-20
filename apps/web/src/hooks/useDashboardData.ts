import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_SWR_KEY } from "./useProperties";

export function useDashboardData() {
  // ── Properties via SWR (shared with useProperties, single request) ──
  const { data: properties = [] } = useSWR<any[]>(
    PROPERTIES_SWR_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Auto-select first property when data loads
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // ── Current date params ──
  const dateParams = useMemo(() => {
    const date = new Date();
    return {
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1,
    };
  }, []);

  // ── Consolidated Dashboard Data via SWR ──
  // One single endpoint to fetch summary, chart data, and recent activity
  const dashboardKey = selectedPropertyId
    ? `/analysis/dashboard?property_id=${selectedPropertyId}&year=${dateParams.currentYear}&month=${dateParams.currentMonth}`
    : null;

  const { data: dashboardData = null, isLoading: isDashboardLoading } = useSWR(
    dashboardKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s
    }
  );

  const summary = dashboardData?.summary || null;
  
  // Format chart data for Recharts
  const chartData = useMemo(() => {
    if (!dashboardData?.chart_data) return [];
    
    // The backend returns it in chronological order from oldest to newest
    // assuming the loop generated 5 months ago first, ending with current month.
    // Wait, the backend loop goes `for i in range(5, -1, -1)`, which means it appends oldest first.
    return dashboardData.chart_data.map((m: any) => {
      const d = new Date(m.year, m.month - 1, 1);
      return {
        name: d.toLocaleString("es", { month: "short" }),
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

  const isLoading = isDashboardLoading && !!selectedPropertyId;

  return {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    summary,
    chartData,
    recentActivity,
    isLoading,
  };
}


