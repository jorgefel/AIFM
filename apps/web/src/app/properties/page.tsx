"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

// Hooks
import { useProperties } from "@/hooks/useProperties";

// Components
import { PropertyList } from "@/components/properties/PropertyList";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default function PropertiesPage() {
  const {
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
  } = useProperties();

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mis Propiedades</h1>
            <p className="text-slate-400 mt-1">Gestiona tus propiedades, ubicaciones y monedas principales.</p>
          </div>
          <Button onClick={openNewModal} className="shrink-0 group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nueva Propiedad
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <PropertyList 
            properties={properties} 
            isLoading={isLoading} 
            onEdit={openEditModal} 
            onDelete={setDeleteTarget} 
          />
        </motion.div>
      </motion.div>

      {/* Form Modal */}
      <PropertyForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditing={!!editingId}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel="Eliminar"
      />
    </DashboardLayout>
  );
}
