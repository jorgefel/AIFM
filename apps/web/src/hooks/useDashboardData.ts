import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
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
      date,
    };
  }, []);

  // ── Summary for current month via SWR (cached + deduplicated) ──
  const summaryKey = selectedPropertyId
    ? `/analysis/summary?property_id=${selectedPropertyId}&year=${dateParams.currentYear}&month=${dateParams.currentMonth}`
    : null;

  const { data: summary = null, isLoading: isSummaryLoading } = useSWR(
    summaryKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s — summary data doesn't change often
    }
  );

  // ── Chart data (last 6 months) — fetched in parallel, cached by SWR ──
  const [chartData, setChartData] = useState<any[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId) return;

    const fetchChartData = async () => {
      setIsChartLoading(true);
      try {
        const months: { d: Date; y: number; m: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(dateParams.currentYear, dateParams.date.getMonth() - i, 1);
          months.push({ d, y: d.getFullYear(), m: d.getMonth() + 1 });
        }

        // Parallel fetch instead of sequential loop (was 6 sequential awaits)
        const results = await Promise.all(
          months.map(({ y, m }) =>
            api
              .get(`/analysis/summary?property_id=${selectedPropertyId}&year=${y}&month=${m}`)
              .then((res) => res.data)
              .catch(() => null)
          )
        );

        const newChartData = months.map(({ d }, idx) => ({
          name: d.toLocaleString("es", { month: "short" }),
          Ingresos: results[idx]?.gross_income ?? 0,
          Gastos: results[idx]?.total_expenses ?? 0,
        }));

        setChartData(newChartData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedPropertyId, dateParams]);

  // ── Recent activity ──
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedPropertyId) return;

    const fetchActivity = async () => {
      try {
        const [resData, expData] = await Promise.all([
          api.get(`/reservations/?property_id=${selectedPropertyId}`),
          api.get(`/expenses/?property_id=${selectedPropertyId}`),
        ]);

        const activities = [
          ...resData.data.map((r: any) => ({
            id: `res-${r.id}`,
            type: "reservation",
            title: `Reserva: ${r.guest_name}`,
            date: new Date(r.created_at),
            amount: r.net_amount,
            platform: r.platform,
          })),
          ...expData.data.map((e: any) => ({
            id: `exp-${e.id}`,
            type: "expense",
            title: `Gasto: ${e.category}`,
            date: new Date(e.date),
            amount: e.amount,
          })),
        ]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching activity:", error);
      }
    };

    fetchActivity();
  }, [selectedPropertyId]);

  const isLoading = isSummaryLoading || isChartLoading;

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

