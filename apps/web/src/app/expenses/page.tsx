"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Edit2, Trash2, Filter, Upload, FileText, ReceiptText } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, Variants } from "framer-motion";

interface Property {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  property_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  receipt_url: string | null;
}

export default function ExpensesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    category: "maintenance",
    date: new Date().toISOString().split("T")[0],
    currency: "USD"
  });
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchExpenses = useCallback(async (propertyId: string) => {
    if (!propertyId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/expenses/?property_id=${propertyId}`);
      setExpenses(data);
    } catch {
      toast.error("Error", "No se pudieron cargar los gastos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchExpenses(selectedPropertyId);
    }
  }, [selectedPropertyId, fetchExpenses]);

  const handleUploadReceipt = async (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`/expenses/${expenseId}/receipt`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        property_id: selectedPropertyId,
        amount: Number(formData.amount)
      };

      let expenseId = editingId;

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        const { data } = await api.post("/expenses/", payload);
        expenseId = data.id;
      }
      
      if (receiptFile && expenseId) {
        await handleUploadReceipt(expenseId, receiptFile);
      }

      setIsModalOpen(false);
      toast.success(editingId ? "Gasto actualizado" : "Gasto registrado", "El gasto se guardó correctamente.");
      fetchExpenses(selectedPropertyId);
    } catch {
      toast.error("Error", "No se pudo guardar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/expenses/${deleteTarget}`);
      toast.success("Gasto eliminado", "El gasto fue eliminado correctamente.");
      fetchExpenses(selectedPropertyId);
    } catch {
      toast.error("Error", "No se pudo eliminar el gasto.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      description: "",
      amount: 0,
      category: "maintenance",
      date: new Date().toISOString().split("T")[0],
      currency: "USD"
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      currency: exp.currency
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: "Descripción", accessorKey: "description" },
    { 
      header: "Categoría", 
      accessorKey: "category",
      cell: (item: Expense) => <span className="capitalize">{item.category}</span>
    },
    { header: "Fecha", accessorKey: "date" },
    { 
      header: "Monto", 
      accessorKey: "amount",
      cell: (item: Expense) => (
        <span className="font-bold text-coral-accent">
          -${item.amount.toFixed(2)} {item.currency}
        </span>
      )
    },
    {
      header: "Recibo",
      accessorKey: "receipt_url",
      cell: (item: Expense) => (
        item.receipt_url ? (
          <a 
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${item.receipt_url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <FileText className="w-4 h-4" /> Ver
          </a>
        ) : (
          <span className="text-xs text-slate-500">Sin recibo</span>
        )
      )
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Expense) => (
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
            <h1 className="text-3xl font-bold text-white tracking-tight">Gastos Operativos</h1>
            <p className="text-slate-400 mt-1">Registra y controla los egresos de tus propiedades.</p>
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
              Nuevo Gasto
            </Button>
          </div>
        </motion.div>

        {!selectedPropertyId && !isLoading && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
            No tienes propiedades registradas. Crea una propiedad antes de añadir gastos.
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <DataTable 
            data={expenses} 
            columns={columns} 
            isLoading={isLoading} 
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ReceiptText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-300 mb-1">Sin gastos registrados</p>
                <p className="text-sm max-w-sm mx-auto">No hay gastos para esta propiedad. Haz clic en "Nuevo Gasto" para registrar uno.</p>
              </div>
            }
          />
        </motion.div>
      </motion.div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Editar Gasto" : "Nuevo Gasto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Descripción" 
            placeholder="Ej. Reparación de tubería" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="number"
              step="0.01"
              label="Monto" 
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
            <Select 
              label="Moneda" 
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={[
                { value: "USD", label: "Dólares (USD)" },
                { value: "MXN", label: "Pesos Mexicanos (MXN)" },
                { value: "EUR", label: "Euros (EUR)" },
              ]}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Categoría" 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: "maintenance", label: "Mantenimiento" },
                { value: "cleaning", label: "Limpieza" },
                { value: "utilities", label: "Servicios (Agua, Luz)" },
                { value: "supplies", label: "Insumos" },
                { value: "taxes", label: "Impuestos" },
                { value: "other", label: "Otro" },
              ]}
              required
            />
            <Input 
              type="date"
              label="Fecha" 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Comprobante (Opcional)</label>
            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {receiptFile ? receiptFile.name : "Subir Archivo"}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReceiptFile(e.target.files[0]);
                  }
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Imágenes (PNG, JPG) o PDF. Máx 5MB.</p>
          </div>

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
