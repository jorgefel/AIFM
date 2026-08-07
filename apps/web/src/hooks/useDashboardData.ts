import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function useDashboardData() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get("/properties/");
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error fetching properties:", e);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth() + 1;

        // Fetch current month summary
        const summaryRes = await api.get(`/analysis/summary?property_id=${selectedPropertyId}&year=${currentYear}&month=${currentMonth}`);
        setSummary(summaryRes.data);

        // Fetch last 6 months for the chart
        const newChartData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentYear, date.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          
          try {
            const res = await api.get(`/analysis/summary?property_id=${selectedPropertyId}&year=${y}&month=${m}`);
            newChartData.push({
              name: d.toLocaleString('es', { month: 'short' }),
              Ingresos: res.data.gross_income,
              Gastos: res.data.total_expenses
            });
          } catch (e) {
            newChartData.push({
              name: d.toLocaleString('es', { month: 'short' }),
              Ingresos: 0,
              Gastos: 0
            });
          }
        }
        setChartData(newChartData);

        // Fetch recent activity
        const [resData, expData] = await Promise.all([
          api.get(`/reservations/?property_id=${selectedPropertyId}`),
          api.get(`/expenses/?property_id=${selectedPropertyId}`)
        ]);

        const activities = [
          ...resData.data.map((r: any) => ({
            id: `res-${r.id}`,
            type: "reservation",
            title: `Reserva: ${r.guest_name}`,
            date: new Date(r.created_at),
            amount: r.net_amount,
            platform: r.platform
          })),
          ...expData.data.map((e: any) => ({
            id: `exp-${e.id}`,
            type: "expense",
            title: `Gasto: ${e.category}`,
            date: new Date(e.date),
            amount: e.amount
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        setRecentActivity(activities);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPropertyId]);

  return {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    summary,
    chartData,
    recentActivity,
    isLoading
  };
}
