"use client";

import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PLATFORM_LABELS } from "@/lib/commissions";
import type { ReservationPatch } from "@/hooks/useCalendar";
import type { Reservation } from "@/types/models";

interface ReservationDetailProps {
  reservation: Reservation | null;
  propertyName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, patch: ReservationPatch) => Promise<boolean>;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-violet-700 bg-violet-50 border-violet-200",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  completed: "text-teal-700 bg-teal-50 border-teal-200",
  cancelled: "text-coral-accent bg-coral-accent/10 border-coral-accent/20",
};

function formatDay(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: es });
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function ReservationDetail({
  reservation,
  propertyName,
  isOpen,
  onClose,
  onSave,
}: ReservationDetailProps) {
  const { formatCurrency } = useCurrency();
  const [guestName, setGuestName] = useState(reservation?.guest_name ?? "");
  const [notes, setNotes] = useState(reservation?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  if (!reservation) return null;

  const nights = differenceInCalendarDays(
    parseISO(reservation.check_out),
    parseISO(reservation.check_in),
  );
  const statusColor = STATUS_COLORS[reservation.status] ?? "text-ink-muted bg-surface border-line";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const ok = await onSave(reservation.id, {
      guest_name: guestName.trim(),
      notes: notes.trim(),
    });
    setIsSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de la reserva">
      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-surface p-4">
        {propertyName && <Fact label="Propiedad">{propertyName}</Fact>}
        <Fact label="Llegada">{formatDay(reservation.check_in)}</Fact>
        <Fact label="Salida">{formatDay(reservation.check_out)}</Fact>
        <Fact label="Noches">{nights}</Fact>
        <Fact label="Plataforma">
          {PLATFORM_LABELS[reservation.platform] ?? reservation.platform}
        </Fact>
        <Fact label="Monto bruto">{formatCurrency(Number(reservation.total_amount))}</Fact>
        <Fact label="Neto">{formatCurrency(Number(reservation.net_amount))}</Fact>
        <Fact label="Estado">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {STATUS_LABELS[reservation.status] ?? reservation.status}
          </span>
        </Fact>
      </dl>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Huésped"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />
        <div>
          <label htmlFor="reservation-notes" className="mb-1.5 block text-sm font-medium text-ink/80">
            Notas
          </label>
          <textarea
            id="reservation-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hora de llegada, solicitudes del huésped, recordatorios"
            className="w-full resize-none rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-ink-muted/60 transition-all focus:border-violet-400 focus:bg-card focus:outline-none focus:ring-2 focus:ring-violet-500/15"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
