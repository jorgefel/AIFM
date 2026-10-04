"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Plus, Filter } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, Variants } from "framer-motion";

// Hooks
import { useExpenses } from "@/hooks/useExpenses";
import { Expense } from "@/types/models";

// Components
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const { formatCurrency } = useCurrency();

  const {
    properties,
    selectedPropertyId, setSelectedPropertyId,
    expenses,
    isLoading,
    isSubmitting,
    formData, setFormData,
    receiptFile, setReceiptFile,
    submitExpense,
    deleteExpense,
    resetForm,
    loadForm
  } = useExpenses();

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

  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    loadForm(exp);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitExpense(editingId);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteExpense(deleteTarget);
    if (success) {
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">Gastos Operativos</h1>
            <p className="text-ink-muted mt-1">Registra y controla los egresos de tus propiedades.</p>
          </div>
          <div className="flex items-center gap-3">
            {properties.length > 0 && (
              <div className="flex items-center bg-card border border-line rounded-lg px-3 py-1 shadow-sm">
                <Filter className="w-4 h-4 text-ink-muted mr-2" />
                <select 
                  className="bg-transparent text-ink text-sm focus:outline-none border-none py-1"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id} className="bg-card text-ink">{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={openNewModal} disabled={!selectedPropertyId}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto
            </Button>
          </div>
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            No tienes propiedades registradas. Crea una propiedad antes de añadir gastos.
          </motion.div>
        )}

        <ExpenseList 
          expenses={expenses}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          itemVariants={itemVariants}
        />
      </motion.div>

      <ExpenseForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Gasto"
        message="¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer."
      />
    </DashboardLayout>
  );
}
