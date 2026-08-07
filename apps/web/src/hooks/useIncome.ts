import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Property, Reservation } from "@/types/models";

export function useIncome() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchProperties = async () => {
    try {
      const { data } = await api.get("/properties/");
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch {
      toast.error("Error", "No se pudieron cargar las propiedades.");
      setIsLoading(false);
    }
  };

  const fetchReservations = useCallback(async (propertyId: string) => {
    if (!propertyId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/reservations/?property_id=${propertyId}`);
      setReservations(data);
    } catch {
      toast.error("Error", "No se pudieron cargar las reservas.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchReservations(selectedPropertyId);
    }
  }, [selectedPropertyId, fetchReservations]);

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
      fetchReservations(selectedPropertyId);
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
      fetchReservations(selectedPropertyId);
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
    isLoading,
    isSubmitting,
    formData, setFormData,
    submitReservation,
    deleteReservation,
    resetForm,
    loadForm
  };
}
