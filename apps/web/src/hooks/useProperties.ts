import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/contexts/ToastContext";
import { Property } from "@/types/models";

/**
 * React Query key for properties — exported so other hooks can revalidate
 * without importing the full hook.
 */
export const PROPERTIES_QUERY_KEY = ["properties"];

export function useProperties() {
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: () => fetcher("/properties/"),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

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
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY }); // Revalidate cache
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
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY }); // Revalidate cache
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
