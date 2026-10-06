import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { Property } from "@/types/models";

export function useProperty(id: string | undefined) {
  const { data, error, isLoading } = useQuery<Property | null>({
    queryKey: ["property", id],
    queryFn: () => fetcher(`/properties/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60,
  });

  return { property: data ?? null, error, isLoading };
}
