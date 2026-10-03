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

export type PropertyFormData = {
  name: string;
  address: string;
  currency: string;
  property_type: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  nightly_rate: string;
  amenities: string[];
  published_platforms: string[];
  photo_urls: string[];
};

const emptyProperty: PropertyFormData = {
  name: "", address: "", currency: "USD", property_type: "apartment",
  max_guests: 1, bedrooms: 1, bathrooms: 1, description: "", nightly_rate: "",
  amenities: [], published_platforms: [], photo_urls: [],
};

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
  
  const [formData, setFormData] = useState<PropertyFormData>(emptyProperty);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.published_platforms.length) {
      toast.warning("Elige una plataforma", "Indica dónde está publicada la propiedad.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        nightly_rate: formData.nightly_rate === "" ? null : Number(formData.nightly_rate),
      };
      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
        toast.success("Propiedad actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await api.post("/properties/", payload);
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
    setFormData(emptyProperty);
    setIsModalOpen(true);
  };

  const openEditModal = (prop: Property) => {
    setEditingId(prop.id);
    setFormData({
      name: prop.name, address: prop.address, currency: prop.currency,
      property_type: prop.property_type ?? "apartment",
      max_guests: prop.max_guests ?? 1, bedrooms: prop.bedrooms ?? 1, bathrooms: prop.bathrooms ?? 1,
      description: prop.description ?? "", nightly_rate: prop.nightly_rate?.toString() ?? "",
      amenities: prop.amenities ?? [], published_platforms: prop.published_platforms ?? [], photo_urls: prop.photo_urls ?? [],
    });
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
