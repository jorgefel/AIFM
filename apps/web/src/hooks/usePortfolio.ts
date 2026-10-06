import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { buildDemoReservations } from "@/lib/demoPortfolio";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import type { Property, Reservation } from "@/types/models";

export const PORTFOLIO_QUERY_KEY = ["portfolio-reservations"];

export function usePortfolio() {
  const { isDemoMode } = useAuth();

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2,
  });

  const propertyIds = properties.map((p) => p.id);

  const { data, isLoading } = useQuery<Reservation[]>({
    queryKey: [...PORTFOLIO_QUERY_KEY, propertyIds],
    queryFn: async () => {
      const results = await Promise.all(
        propertyIds.map((id) => fetcher(`/reservations/?property_id=${id}`) as Promise<Reservation[]>),
      );
      return results.flat();
    },
    enabled: !isDemoMode && propertyIds.length > 0,
    staleTime: 1000 * 60,
  });

  const demoReservations = useMemo(
    () => (isDemoMode ? buildDemoReservations(properties) : []),
    [isDemoMode, properties],
  );

  return {
    properties,
    reservations: isDemoMode ? demoReservations : (data ?? []),
    isLoading: isLoadingProperties || isLoading,
  };
}
