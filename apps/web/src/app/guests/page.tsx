"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Building,
  Clock,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import type { Guest, GuestDetail } from "@/types/models";

export default function GuestsPage() {
  const toast = useToast();
  const { isDemoMode } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formDoc, setFormDoc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch guests
  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ["guests", query],
    queryFn: () => {
      const url = query.trim() ? `/guests?q=${encodeURIComponent(query.trim())}` : "/guests";
      return fetcher(url);
    },
  });

  // Fetch guest detail
  const { data: guestDetail, isLoading: isLoadingDetail } = useQuery<GuestDetail>({
    queryKey: ["guest", selectedGuestId],
    queryFn: () => fetcher(`/guests/${selectedGuestId}`),
    enabled: !!selectedGuestId,
  });

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: { first_name: string; last_name: string; document_or_keyword?: string | null }) => {
      if (editingGuest) {
        return api.put(`/guests/${editingGuest.id}`, payload);
      }
      return api.post("/guests", payload);
    },
    onSuccess: () => {
      toast.success(editingGuest ? "Huésped actualizado" : "Huésped registrado", "Los datos se guardaron con éxito.");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      if (selectedGuestId) {
        queryClient.invalidateQueries({ queryKey: ["guest", selectedGuestId] });
      }
      closeForm();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      setFormError(typeof detail === "string" ? detail : "No se pudo guardar el huésped.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/guests/${id}`);
    },
    onSuccess: () => {
      toast.success("Huésped eliminado", "El registro del huésped ha sido eliminado.");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setDeleteTargetId(null);
      if (selectedGuestId) setSelectedGuestId(null);
    },
    onError: () => {
      toast.error("Error", "No se pudo eliminar el huésped.");
      setDeleteTargetId(null);
    },
  });

  const openNewForm = () => {
    setEditingGuest(null);
    setFormFirstName("");
    setFormLastName("");
    setFormDoc("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (guest: Guest) => {
    setEditingGuest(guest);
    setFormFirstName(guest.first_name);
    setFormLastName(guest.last_name);
    setFormDoc(guest.document_or_keyword || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGuest(null);
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim()) {
      setFormError("Por favor ingresa nombre y apellidos.");
      return;
    }
    saveMutation.mutate({
      first_name: formFirstName.trim(),
      last_name: formLastName.trim(),
      document_or_keyword: formDoc.trim() || null,
    });
  };

  const totalNightsAccumulated = guests.reduce((sum, g) => sum + (g.total_nights || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Huéspedes</h1>
            <p className="text-sm text-ink-muted">
              Directorio de huéspedes, estadísticas de estadías e historial acumulado.
            </p>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Huésped
          </Button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-surface p-4 flex items-center gap-4">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">Huéspedes Registrados</p>
              <p className="text-2xl font-bold text-ink">{guests.length}</p>
            </div>
          </div>
          <div className="card-surface p-4 flex items-center gap-4">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">Noches Totales Hospedadas</p>
              <p className="text-2xl font-bold text-ink">{totalNightsAccumulated}</p>
            </div>
          </div>
          <div className="card-surface p-4 flex items-center gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">Promedio por Huésped</p>
              <p className="text-2xl font-bold text-ink">
                {guests.length > 0 ? (totalNightsAccumulated / guests.length).toFixed(1) : 0} noches
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o palabra clave..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder-ink-muted transition-all focus:border-violet-400 focus:bg-card focus:outline-none focus:ring-2 focus:ring-violet-500/15"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-3 text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Guests table */}
        <div className="card-surface overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : guests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-violet-50 p-4 text-violet-600 mb-3">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-ink">No hay huéspedes registrados</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                {query
                  ? "No se encontraron huéspedes con ese criterio de búsqueda."
                  : "Los huéspedes se guardan al registrar reservas o puedes agregarlos manualmente con el botón 'Nuevo Huésped'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface/50 text-xs font-semibold text-ink-muted">
                  <tr>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Identificación / Palabra Clave</th>
                    <th className="px-5 py-3 text-center">Noches</th>
                    <th className="px-5 py-3 text-center">Propiedades</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {guest.first_name} {guest.last_name}
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        {guest.document_or_keyword ? (
                          <span className="rounded-md bg-violet-100/70 px-2 py-0.5 text-xs font-mono font-medium text-violet-800">
                            {guest.document_or_keyword}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-ink">
                        {guest.total_nights}
                      </td>
                      <td className="px-5 py-3.5 text-center text-ink-muted">
                        {guest.properties_count}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedGuestId(guest.id)}
                            className="rounded-lg p-1.5 text-ink-muted hover:bg-violet-50 hover:text-violet-600 transition-colors"
                            title="Ver historial"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(guest)}
                            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(guest.id)}
                            className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create / Edit Guest */}
        <Modal
          isOpen={isFormOpen}
          onClose={closeForm}
          title={editingGuest ? "Editar Huésped" : "Nuevo Huésped"}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                placeholder="Ej. Juan"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                required
              />
              <Input
                label="Apellidos"
                placeholder="Ej. Pérez"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Identificación o palabra clave (opcional)"
              placeholder="Ej. CC 123456 o 'Cliente VIP'"
              value={formDoc}
              onChange={(e) => setFormDoc(e.target.value)}
            />

            {formError && (
              <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-line-soft">
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={saveMutation.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Guest Detail & Stay History */}
        <Modal
          isOpen={!!selectedGuestId}
          onClose={() => setSelectedGuestId(null)}
          title="Historial del Huésped"
        >
          {isLoadingDetail || !guestDetail ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="flex items-start justify-between rounded-xl border border-line bg-surface p-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {guestDetail.first_name} {guestDetail.last_name}
                  </h3>
                  {guestDetail.document_or_keyword && (
                    <p className="mt-0.5 text-xs text-ink-muted font-mono">
                      ID / Palabra clave: {guestDetail.document_or_keyword}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                    {guestDetail.total_nights} noches totales
                  </span>
                </div>
              </div>

              {/* Properties stayed */}
              {guestDetail.properties_stayed && guestDetail.properties_stayed.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Propiedades donde se ha alojado
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {guestDetail.properties_stayed.map((name) => (
                      <span
                        key={name}
                        className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink flex items-center gap-1.5"
                      >
                        <Building className="h-3.5 w-3.5 text-violet-600" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stays list */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Historial de Estadías ({guestDetail.stays.length})
                </h4>
                {guestDetail.stays.length === 0 ? (
                  <p className="text-xs text-ink-muted italic py-3">No hay reservas registradas para este huésped.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {guestDetail.stays.map((stay) => (
                      <div
                        key={stay.reservation_id}
                        className="flex items-center justify-between rounded-xl border border-line bg-card p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-ink">{stay.property_name}</p>
                          <p className="text-ink-muted flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {stay.check_in} al {stay.check_out} ({stay.nights} {stay.nights === 1 ? "noche" : "noches"})
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              stay.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : stay.status === "cancelled"
                                ? "bg-red-100 text-red-800 line-through"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {stay.status === "completed"
                              ? "Completada"
                              : stay.status === "cancelled"
                              ? "Cancelada"
                              : "Confirmada"}
                          </span>
                          <p className="text-ink font-semibold mt-1">
                            ${stay.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setSelectedGuestId(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirm Delete */}
        <ConfirmDialog
          isOpen={!!deleteTargetId}
          title="¿Eliminar huésped?"
          message="El registro del huésped será eliminado del directorio. Las reservas pasadas y futuras se mantendrán intactas."
          confirmLabel="Eliminar"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
