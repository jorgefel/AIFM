import useSWR from "swr";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/contexts/ToastContext";

export interface DashboardLayoutData {
  layout_data: any[];
}

export function useDashboardLayout() {
  const toast = useToast();
  
  const { data, error, isLoading, mutate } = useSWR<DashboardLayoutData>(
    "/dashboard/layout",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const saveLayout = async (newLayout: any[]) => {
    try {
      // Optimistic update
      mutate({ layout_data: newLayout }, false);
      
      await api.put("/dashboard/layout", { layout_data: newLayout });
      
      // Revalidate to ensure backend matches
      mutate();
      return true;
    } catch (err) {
      toast.error("Error", "No se pudo guardar el diseño del dashboard.");
      mutate(); // Rollback on error
      return false;
    }
  };

  return {
    layout: data?.layout_data || [],
    isLoading,
    error,
    saveLayout,
  };
}
