import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MarketComparison } from "@/types/marketComparison";

export function useMarketComparison(propertyId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["market-comparison", propertyId];
  const query = useQuery<MarketComparison>({
    queryKey,
    queryFn: () => api.get(`/properties/${propertyId}/market-comparisons/latest`).then((res) => res.data),
    enabled: Boolean(propertyId),
    refetchInterval: (result) => result.state.data?.status === "READY" ? false : 3000,
  });
  const refresh = useMutation({
    mutationFn: () => api.post(`/properties/${propertyId}/market-comparisons`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { ...query, refresh };
}
