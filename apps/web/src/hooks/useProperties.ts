import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/contexts/ToastContext";
import { Property } from "@/types/models";

/**
 * SWR key for properties — exported so other hooks can revalidate
 * without importing the full hook.
 */
export const PROPERTIES_SWR_KEY = "/properties/";

export function useProperties() {
  const { data: properties = [], isLoading, mutate } = useSWR<Property[]>(
    PROPERTIES_SWR_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10s — deduplicates across all components
    }
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: "", address: "", currency: "USD" });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/properties/${editingId}`, formData);
        toast.success("Propiedad actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await api.post("/properties/", formData);
        toast.success("Propiedad creada", "La propiedad se registró correctamente.");
      }
      setIsModalOpen(false);
      mutate(); // Revalidate the SWR cache
    } catch {
      toast.error("Error", "No se pudo guardar la propiedad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/properties/${deleteTarget}`);
      toast.success("Propiedad eliminada", "La propiedad fue eliminada correctamente.");
      mutate(); // Revalidate the SWR cache
    } catch {
      toast.error("Error", "No se pudo eliminar la propiedad.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: "", address: "", currency: "USD" });
    setIsModalOpen(true);
  };

  const openEditModal = (prop: Property) => {
    setEditingId(prop.id);
    setFormData({ name: prop.name, address: prop.address, currency: prop.currency });
    setIsModalOpen(true);
  };

  return {
    properties,
    isLoading,
    isModalOpen, setIsModalOpen,
    isSubmitting,
    deleteTarget, setDeleteTarget,
    formData, setFormData,
    editingId,
    handleSubmit,
    handleDelete,
    openNewModal,
    openEditModal
  };
}
