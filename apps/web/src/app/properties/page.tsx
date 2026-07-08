"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { motion, Variants } from "framer-motion";

interface Property {
  id: string;
  name: string;
  address: string;
  currency: string;
  created_at: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Form State
  const [formData, setFormData] = useState({ name: "", address: "", currency: "USD" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/properties/");
      setProperties(data);
    } catch {
      toast.error("Error", "No se pudieron cargar las propiedades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

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

  const columns = [
    { header: "Nombre", accessorKey: "name" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Moneda", accessorKey: "currency" },
    {
      header: "Fecha de Creación",
      accessorKey: "created_at",
      cell: (item: Property) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Property) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openEditModal(item)}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDeleteTarget(item.id)}
            className="p-1.5 text-slate-400 hover:text-coral-accent hover:bg-coral-accent/10 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Propiedades</h1>
            <p className="text-slate-400 mt-1">Gestiona los inmuebles que tienes listados.</p>
          </div>
          <Button onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <DataTable 
            data={properties} 
            columns={columns} 
            isLoading={isLoading} 
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-300 mb-1">Sin propiedades</p>
                <p className="text-sm max-w-sm mx-auto">No tienes propiedades registradas aún. Haz clic en "Nueva Propiedad" para comenzar.</p>
              </div>
            }
          />
        </motion.div>
      </motion.div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Propiedad"
        message="¿Estás seguro de que deseas eliminar esta propiedad? Todos los datos asociados podrían verse afectados."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Editar Propiedad" : "Nueva Propiedad"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre de la Propiedad" 
            placeholder="Ej. Villa Tulum" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input 
            label="Dirección" 
            placeholder="Dirección completa" 
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <Select 
            label="Moneda Principal" 
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[
              { value: "USD", label: "Dólares (USD)" },
              { value: "MXN", label: "Pesos Mexicanos (MXN)" },
              { value: "COP", label: "Pesos Colombianos (COP)" },
              { value: "EUR", label: "Euros (EUR)" },
            ]}
            required
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
