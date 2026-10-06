import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Property, Reservation } from "@/types/models";

export function useIncome() {
  const queryClient = useQueryClient();
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { currency } = useCurrency();

  const [formData, setFormData] = useState({
    guest_name: "",
    check_in: "",
    check_out: "",
    total_amount: "" as any,
    platform_fee: "" as any,
    currency,
    platform: "airbnb",
    status: "confirmed"
  });

  // Auto-select first property
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // ── Reservations via React Query ──
  const reservationsKey = ["reservations", selectedPropertyId];

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: reservationsKey,
    queryFn: () => fetcher(`/reservations/?property_id=${selectedPropertyId}`),
    enabled: !!selectedPropertyId,
    staleTime: 0, // No cache for reservation status endpoints as requested
  });

  const submitReservation = async (editingId: string | null) => {
    if (!selectedPropertyId || !formData.check_in || !formData.check_out || formData.check_out <= formData.check_in) {
      toast.warning("Revisa las fechas", "La salida debe ser posterior a la entrada.");
      return false;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        property_id: selectedPropertyId,
        total_amount: Number(formData.total_amount),
        platform_fee: Number(formData.platform_fee)
      };

      if (editingId) {
        await api.put(`/reservations/${editingId}`, payload);
      } else {
        await api.post("/reservations/", payload);
      }
      
      toast.success(editingId ? "Reserva actualizada" : "Reserva registrada", "La reserva se guardó correctamente.");
      // Revalidate cache
      queryClient.invalidateQueries({ queryKey: reservationsKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return true;
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      toast.error("No se pudo guardar", typeof detail === "string" ? detail : "Revisa los datos de la reserva.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      await api.delete(`/reservations/${id}`);
      toast.success("Reserva cancelada", "La reserva fue eliminada correctamente.");
      queryClient.invalidateQueries({ queryKey: reservationsKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return true;
    } catch {
      toast.error("Error", "No se pudo eliminar la reserva.");
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      guest_name: "",
      check_in: "",
      check_out: "",
      total_amount: "" as any,
      platform_fee: "" as any,
      currency,
      platform: "airbnb",
      status: "confirmed"
    });
  };

  const loadForm = (res: Reservation) => {
    setFormData({
      guest_name: res.guest_name,
      check_in: res.check_in,
      check_out: res.check_out,
      total_amount: res.total_amount,
      platform_fee: res.platform_fee,
      currency: res.currency as any,
      platform: res.platform,
      status: res.status
    });
  };

  return {
    properties,
    selectedPropertyId, setSelectedPropertyId,
    reservations,
    isLoading: isLoading && !!selectedPropertyId,
    isSubmitting,
    formData, setFormData,
    submitReservation,
    deleteReservation,
    resetForm,
    loadForm
  };
}
