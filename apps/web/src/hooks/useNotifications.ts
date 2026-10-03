import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

export interface Notification {
  id: string;
  type: string;
  severity: "high" | "medium" | "info";
  title: string;
  message: string;
  property_id: string;
  property_name: string;
  action_url: string;
}

export function useNotifications() {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["operational-alerts"],
    queryFn: () => fetcher("/analysis/alerts"),
    staleTime: 1000 * 60,
    retry: false,
  });
  return { notifications, isLoading };
}
