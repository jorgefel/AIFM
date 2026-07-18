"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Plus, Edit2, Trash2, Filter, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, Variants } from "framer-motion";

interface Property {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  property_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  platform: string;
  status: string;
}

export default function IncomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();
  const { formatCurrency } = useCurrency();

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
    guest_name: "",
    check_in: "",
    check_out: "",
    total_amount: "" as any,
    platform_fee: "" as any,
    currency,
    platform: "airbnb",
    status: "confirmed"
  });

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

  const fetchReservations = useCallback(async (propertyId: string) => {
    if (!propertyId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/reservations/?property_id=${propertyId}`);
      setReservations(data);
    } catch {
      toast.error("Error", "No se pudieron cargar las reservas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchReservations(selectedPropertyId);
    }
  }, [selectedPropertyId, fetchReservations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        property_id: selectedPropertyId,
        total_amount: Number(formData.total_amount),
        platform_fee: Number(formData.platform_fee)
      };

      if (editingId) {
        await api.put(`/reservations/${editingId}`, payload);
      } else {
        await api.post("/reservations/", payload);
      }
      setIsModalOpen(false);
      toast.success(editingId ? "Reserva actualizada" : "Reserva registrada", "La reserva se guardó correctamente.");
      fetchReservations(selectedPropertyId);
    } catch {
      toast.error("Error", "No se pudo guardar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/reservations/${deleteTarget}`);
      toast.success("Reserva cancelada", "La reserva fue eliminada correctamente.");
      fetchReservations(selectedPropertyId);
    } catch {
      toast.error("Error", "No se pudo eliminar la reserva.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      guest_name: "",
      check_in: "",
      check_out: "",
      total_amount: "" as any,
      platform_fee: "" as any,
      currency,
      platform: "airbnb",
      status: "confirmed"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (res: Reservation) => {
    setEditingId(res.id);
    setFormData({
      guest_name: res.guest_name,
      check_in: res.check_in,
      check_out: res.check_out,
      total_amount: res.total_amount,
      platform_fee: res.platform_fee,
      currency: res.currency,
      platform: res.platform,
      status: res.status
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: "Huésped", accessorKey: "guest_name" },
    { 
      header: "Plataforma", 
      accessorKey: "platform",
      cell: (item: Reservation) => <span className="capitalize">{item.platform}</span>
    },
    { 
      header: "Fechas", 
      accessorKey: "dates",
      cell: (item: Reservation) => `${item.check_in} a ${item.check_out}`
    },
    { 
      header: "Neto", 
      accessorKey: "net_amount",
      cell: (item: Reservation) => (
        <span className="font-bold text-emerald-400">
          {formatCurrency(item.net_amount)}
        </span>
      )
    },
    { 
      header: "Estado", 
      accessorKey: "status",
      cell: (item: Reservation) => {
        const colors: any = {
          confirmed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
          pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
          cancelled: "text-coral-accent bg-coral-accent/10 border-coral-accent/20",
          completed: "text-blue-400 bg-blue-400/10 border-blue-400/20"
        };
        const color = colors[item.status] || "text-slate-400 bg-slate-400/10 border-slate-400/20";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color} capitalize`}>
            {item.status}
          </span>
        );
      }
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Reservation) => (
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

        <motion.div variants={itemVariants}>
          <DataTable 
            data={reservations} 
            columns={columns} 
            isLoading={isLoading} 
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-300 mb-1">Sin reservas registradas</p>
                <p className="text-sm max-w-sm mx-auto">No hay reservaciones para esta propiedad. Haz clic en "Nueva Reserva" para añadir una.</p>
              </div>
            }
          />
        </motion.div>
      </motion.div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Editar Reserva" : "Nueva Reserva"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Huésped" 
            placeholder="Nombre del huésped" 
            value={formData.guest_name}
            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date"
              label="Check-in" 
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              required
            />
            <Input 
              type="date"
              label="Check-out" 
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput
              label="Monto Bruto" 
              value={formData.total_amount}
              onChange={(val) => setFormData({ ...formData, total_amount: val as any })}
              currency={formData.currency}
              required
            />
            <CurrencyInput
              label="Comisión (Platform Fee)" 
              value={formData.platform_fee}
              onChange={(val) => setFormData({ ...formData, platform_fee: val as any })}
              currency={formData.currency}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Plataforma" 
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: "airbnb", label: "Airbnb" },
                { value: "booking", label: "Booking.com" },
                { value: "vrbo", label: "Vrbo" },
                { value: "direct", label: "Directo" },
              ]}
              required
            />
            <Select 
              label="Moneda" 
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
          </div>
          <Select 
            label="Estado" 
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: "confirmed", label: "Confirmada" },
              { value: "pending", label: "Pendiente" },
              { value: "completed", label: "Completada" },
              { value: "cancelled", label: "Cancelada" },
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
