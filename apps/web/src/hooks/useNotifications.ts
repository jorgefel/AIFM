import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: properties } = await api.get("/properties/");
        if (properties.length === 0) return;

        const date = new Date();
        const notifs: Notification[] = [];

        for (const prop of properties.slice(0, 3)) {
          try {
            const { data: summary } = await api.get(
              `/analysis/summary?property_id=${prop.id}&year=${date.getFullYear()}&month=${date.getMonth() + 1}`
            );

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
          } catch {
            // silently skip property
          }
        }

        setNotifications(notifs);
      } catch {
        // No properties or auth error
      }
    };

    fetchNotifications();
  }, [formatCurrency]);

  return { notifications };
}
