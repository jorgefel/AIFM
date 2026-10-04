"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarX, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { IncomeForm } from "@/components/income/IncomeForm";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";
import { PropertyPickerModal } from "@/components/reservations/PropertyPickerModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useIncome } from "@/hooks/useIncome";
import { PORTFOLIO_QUERY_KEY, usePortfolio } from "@/hooks/usePortfolio";
import { containerVariants, itemVariants } from "@/lib/animations";
import { parseDay } from "@/lib/metrics";
import type { Reservation } from "@/types/models";

const TABS = [
  { id: "all", label: "Todas" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "pending", label: "Pendientes" },
  { id: "completed", label: "Completadas" },
  { id: "cancelled", label: "Canceladas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ReservationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const { properties, reservations, isLoading } = usePortfolio();
  const income = useIncome();

  const [tab, setTab] = useState<TabId>("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const autoOpened = useRef(false);

  const startNew = () => {
    if (propertyFilter !== "all") {
      openNewFor(propertyFilter);
    } else if (properties.length > 1) {
      setIsPickerOpen(true);
    } else if (properties.length === 1) {
      openNewFor(properties[0].id);
    } else {
      toast.info("Sin propiedades", "Crea una propiedad antes de registrar reservas.");
    }
  };

  const openNewFor = (propertyId: string) => {
    income.setSelectedPropertyId(propertyId);
    income.resetForm();
    setEditingId(null);
    setIsPickerOpen(false);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (params.get("new") === "1" && properties.length > 0 && !autoOpened.current) {
      autoOpened.current = true;
      startNew();
      router.replace("/reservations");
    }
    // startNew depende de estado local; solo debe dispararse una vez con ?new=1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, properties.length]);

  const openEdit = (reservation: Reservation) => {
    income.setSelectedPropertyId(reservation.property_id);
    income.loadForm(reservation);
    setEditingId(reservation.id);
    setIsFormOpen(true);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      toast.info("Modo demo", "En modo demo los cambios no se guardan.");
      setIsFormOpen(false);
      return;
    }
    const ok = await income.submitReservation(editingId);
    if (ok) {
      refresh();
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isDemoMode) {
      toast.info("Modo demo", "En modo demo los cambios no se guardan.");
    } else {
      const reservation = reservations.find((r) => r.id === deleteTarget);
      if (reservation) income.setSelectedPropertyId(reservation.property_id);
      if (await income.deleteReservation(deleteTarget)) refresh();
    }
    setDeleteTarget(null);
  };

  const counts = useMemo(() => {
    const base = reservations.filter((r) => propertyFilter === "all" || r.property_id === propertyFilter);
    const result: Record<TabId, number> = { all: base.length, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    base.forEach((r) => {
      if (r.status in result) result[r.status as TabId] += 1;
    });
    return result;
  }, [reservations, propertyFilter]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return reservations
      .filter((r) => propertyFilter === "all" || r.property_id === propertyFilter)
      .filter((r) => tab === "all" || r.status === tab)
      .filter((r) => !search || r.guest_name.toLowerCase().includes(search))
      .sort((a, b) => parseDay(b.check_in) - parseDay(a.check_in));
  }, [reservations, propertyFilter, tab, query]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Reservas</h1>
          <p className="mt-1 text-ink-muted">Consulta y administra las reservas de todas tus propiedades.</p>
        </div>
        <Button onClick={startNew} className="group shrink-0">
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          Nueva reserva
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Estado de la reserva" className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                tab === item.id ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
              <span className="rounded-full bg-ink/5 px-1.5 text-xs">{counts[item.id]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Buscar por huésped</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar huésped"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-sm text-ink placeholder-ink-muted/60 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15 sm:w-56"
            />
          </label>
          <label className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm shadow-sm">
            <span className="sr-only">Propiedad</span>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="cursor-pointer bg-transparent py-0.5 text-ink focus:outline-none"
            >
              <option value="all" className="bg-card text-ink">Todas las propiedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-ink">{p.name}</option>
              ))}
            </select>
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : visible.length === 0 ? (
          <div className="card-surface flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-muted">
              <CalendarX className="h-7 w-7" />
            </span>
            <p className="text-lg font-medium text-ink">No hay reservas para mostrar</p>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Cambia los filtros o registra una nueva reserva con el botón de arriba.
            </p>
          </div>
        ) : (
          <ReservationsTable
            reservations={visible}
            properties={properties}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}
      </motion.div>

      <PropertyPickerModal
        isOpen={isPickerOpen}
        properties={properties}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={openNewFor}
      />

      <IncomeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingId={editingId}
        formData={income.formData}
        setFormData={income.setFormData}
        onSubmit={handleSubmit}
        isSubmitting={income.isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel="Eliminar"
      />
    </motion.div>
  );
}

export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <ReservationsContent />
      </Suspense>
    </DashboardLayout>
  );
}
