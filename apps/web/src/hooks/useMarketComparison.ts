import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MarketComparison } from "@/types/marketComparison";

export function useMarketComparison(propertyId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["market-comparison", propertyId];
  const query = useQuery<MarketComparison>({
    queryKey,
    queryFn: () => api.get(`/properties/${propertyId}/competitors`).then((res) => res.data),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60 * 60 * 24,
  });
  const refresh = useMutation({
    mutationFn: () => api.get(`/properties/${propertyId}/competitors?force=true`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { ...query, refresh };
}
