import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import { PORTFOLIO_QUERY_KEY } from "./usePortfolio";
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
    property_id: "",
    guest_name: "",
    check_in: "",
    check_out: "",
    nightly_rate: "" as any,
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
    queryFn: () => fetcher(`/reservations?property_id=${selectedPropertyId}`),
    enabled: !!selectedPropertyId,
    staleTime: 0, // No cache for reservation status endpoints as requested
  });

  const submitReservation = async (editingId: string | null) => {
    const targetPropertyId = formData.property_id || selectedPropertyId;
    if (!targetPropertyId || !formData.check_in || !formData.check_out || formData.check_out <= formData.check_in) {
      toast.warning("Revisa los datos", "Verifica la propiedad y que la salida sea posterior a la entrada.");
      return false;
    }
    setIsSubmitting(true);
    try {
      const { nightly_rate, ...cleanData } = formData;
      const payload = {
        ...cleanData,
        property_id: targetPropertyId,
        total_amount: Number(formData.total_amount),
        platform_fee: Number(formData.platform_fee)
      };

      if (editingId) {
        await api.put(`/reservations/${editingId}`, payload);
      } else {
        await api.post("/reservations", payload);
      }
      
      toast.success(editingId ? "Reserva actualizada" : "Reserva registrada", "La reserva se guardó correctamente.");
      // Revalidate cache
      queryClient.invalidateQueries({ queryKey: reservationsKey });
      if (targetPropertyId !== selectedPropertyId) {
        queryClient.invalidateQueries({ queryKey: ["reservations", targetPropertyId] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      return true;
    } catch {
      toast.error("Error", "No se pudo eliminar la reserva.");
      return false;
    }
  };

  const resetForm = () => {
    const propId = selectedPropertyId || (properties[0]?.id ?? "");
    const prop = properties.find((p) => p.id === propId);
    const rate = prop ? Number(prop.nightly_rate ?? prop.price_per_night ?? 0) : 0;
    setFormData({
      property_id: propId,
      guest_name: "",
      check_in: "",
      check_out: "",
      nightly_rate: rate > 0 ? rate : "",
      total_amount: "" as any,
      platform_fee: "" as any,
      currency: (prop?.currency as any) || currency,
      platform: "airbnb",
      status: "confirmed"
    });
  };

  const loadForm = (res: Reservation) => {
    const [y1, m1, d1] = (res.check_in || "").split("-").map(Number);
    const [y2, m2, d2] = (res.check_out || "").split("-").map(Number);
    const nights = (y1 && y2)
      ? Math.max(1, Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const nightly = Math.round((Number(res.total_amount) / nights) * 100) / 100;

    setFormData({
      property_id: res.property_id,
      guest_name: res.guest_name,
      check_in: res.check_in,
      check_out: res.check_out,
      nightly_rate: nightly,
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
