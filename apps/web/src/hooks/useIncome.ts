import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_SWR_KEY } from "./useProperties";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Property, Reservation } from "@/types/models";

export function useIncome() {
  const { data: properties = [] } = useSWR<Property[]>(
    PROPERTIES_SWR_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

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

  // ── Reservations via SWR (cached + deduplicated) ──
  const reservationsKey = selectedPropertyId
    ? `/reservations/?property_id=${selectedPropertyId}`
    : null;

  const { data: reservations = [], isLoading } = useSWR<Reservation[]>(
    reservationsKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const submitReservation = async (editingId: string | null) => {
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
      // Revalidate the SWR cache
      mutate(reservationsKey);
      return true;
    } catch {
      toast.error("Error", "No se pudo guardar la reserva.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      await api.delete(`/reservations/${id}`);
      toast.success("Reserva cancelada", "La reserva fue eliminada correctamente.");
      mutate(reservationsKey);
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

