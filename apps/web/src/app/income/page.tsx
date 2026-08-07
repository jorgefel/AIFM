"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Plus, Filter } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, Variants } from "framer-motion";

// Hooks
import { useIncome } from "@/hooks/useIncome";
import { Reservation } from "@/types/models";

// Components
import { IncomeForm } from "@/components/income/IncomeForm";
import { IncomeList } from "@/components/income/IncomeList";

export default function IncomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const { formatCurrency } = useCurrency();

  const {
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
  } = useIncome();

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

  const openNewModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (res: Reservation) => {
    setEditingId(res.id);
    loadForm(res);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitReservation(editingId);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteReservation(deleteTarget);
    if (success) {
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Ingresos y Reservas</h1>
            <p className="text-slate-400 mt-1">Lleva el control de todas tus reservaciones.</p>
          </div>
          <div className="flex items-center gap-3">
            {properties.length > 0 && (
              <div className="flex items-center bg-obsidian-light/50 border border-white/10 rounded-lg px-3 py-1">
                <Filter className="w-4 h-4 text-slate-400 mr-2" />
                <select 
                  className="bg-transparent text-white text-sm focus:outline-none border-none py-1"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id} className="bg-obsidian">{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={openNewModal} disabled={!selectedPropertyId}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
            No tienes propiedades registradas. Crea una propiedad antes de añadir reservas.
          </motion.div>
        )}

        <IncomeList 
          reservations={reservations}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          itemVariants={itemVariants}
        />
      </motion.div>

      <IncomeForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
        confirmLabel="Cancelar Reserva"
      />
    </DashboardLayout>
  );
}
