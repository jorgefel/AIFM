"use client";

import { useRouter } from "next/navigation";
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

export default function PropertiesPage() {
  const router = useRouter();
  const {
    properties,
    isLoading,
    deleteTarget, setDeleteTarget,
    handleDelete,
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
            <h1 className="text-3xl font-bold text-ink tracking-tight">Mis Propiedades</h1>
            <p className="text-ink-muted mt-1">Gestiona tus propiedades, precios, capacidad y canales.</p>
          </div>
          <Button onClick={() => router.push("/properties/new")} className="shrink-0 group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nueva Propiedad
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <PropertyList 
            properties={properties} 
            isLoading={isLoading} 
            onDelete={setDeleteTarget} 
          />
        </motion.div>
      </motion.div>

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
