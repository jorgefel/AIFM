import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Property } from "@/types/models";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: "", address: "", currency: "USD" });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const toast = useToast();

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/properties/");
      setProperties(data);
    } catch {
      toast.error("Error", "No se pudieron cargar las propiedades.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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
      fetchProperties();
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
      fetchProperties();
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
