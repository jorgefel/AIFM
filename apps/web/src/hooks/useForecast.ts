import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import type { PropertyForecastResponse } from "@/types/models";

export function useForecast(propertyId?: string, months: number = 3) {
  return useQuery<PropertyForecastResponse>({
    queryKey: ["forecast", propertyId, months],
    queryFn: () => fetcher(`/predictions/forecast?property_id=${propertyId}&months=${months}`),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
