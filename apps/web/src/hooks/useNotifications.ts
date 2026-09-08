import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

export interface Notification {
  id: string;
  type: "warning" | "info" | "alert";
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { formatCurrency } = useCurrency();

  // Properties via React Query
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  useEffect(() => {
    if (properties.length === 0) return;

    const fetchNotifications = async () => {
      const date = new Date();
      const notifs: Notification[] = [];

      // Fetch summaries in parallel instead of sequential loop
      const propsToCheck = properties.slice(0, 3);
      const results = await Promise.all(
        propsToCheck.map((prop) =>
          api
            .get(
              `/analysis/summary?property_id=${prop.id}&year=${date.getFullYear()}&month=${date.getMonth() + 1}`
            )
            .then((res) => ({ prop, summary: res.data }))
            .catch(() => null)
        )
      );

      for (const result of results) {
        if (!result) continue;
        const { prop, summary } = result;

        if (summary.occupancy_rate < 0.3) {
          notifs.push({
            id: `occ-${prop.id}`,
            type: "warning",
            title: `Baja ocupación: ${prop.name}`,
            message: `Solo ${(summary.occupancy_rate * 100).toFixed(0)}% de ocupación este mes.`,
          });
        }

        if (summary.net_profit < 0) {
          notifs.push({
            id: `loss-${prop.id}`,
            type: "alert",
            title: `Pérdida neta: ${prop.name}`,
            message: `Pérdida de ${formatCurrency(Math.abs(summary.net_profit))} este mes.`,
          });
        }
      }

      setNotifications(notifs);
    };

    fetchNotifications();
  }, [properties, formatCurrency]);

  return { notifications };
}
