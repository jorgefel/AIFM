"use client";

import { Edit2, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getChannel } from "@/lib/channels";
import { grossOf, nightsOf, parseDay } from "@/lib/metrics";
import type { Property, Reservation } from "@/types/models";
import { StatusBadge } from "./StatusBadge";

interface ReservationsTableProps {
  reservations: Reservation[];
  properties: Property[];
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });

function formatRange(reservation: Reservation) {
  const from = dateFormatter.format(new Date(parseDay(reservation.check_in) * 86400000));
  const to = dateFormatter.format(new Date(parseDay(reservation.check_out) * 86400000));
  return `${from} - ${to}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const actionClass =
  "rounded-md p-1.5 text-ink-muted transition-colors focus-visible:outline-2 focus-visible:outline-violet-500";

export function ReservationsTable({ reservations, properties, onEdit, onDelete, onStatusChange }: ReservationsTableProps) {
  const { formatCurrency } = useCurrency();
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Propiedad";

  const actions = (reservation: Reservation) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(reservation)}
        aria-label={`Editar reserva de ${reservation.guest_name}`}
        className={`${actionClass} hover:bg-violet-50 hover:text-violet-600`}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(reservation.id)}
        aria-label={`Eliminar reserva de ${reservation.guest_name}`}
        className={`${actionClass} hover:bg-coral-accent/10 hover:text-coral-accent`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="card-surface hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem] text-left">
          <caption className="sr-only">Lista de reservas</caption>
          <thead>
            <tr className="border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <th scope="col" className="px-5 py-3.5">Huésped</th>
              <th scope="col" className="px-5 py-3.5">Propiedad</th>
              <th scope="col" className="px-5 py-3.5">Fechas</th>
              <th scope="col" className="px-5 py-3.5">Canal</th>
              <th scope="col" className="px-5 py-3.5 text-right">Monto</th>
              <th scope="col" className="px-5 py-3.5">Estado</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="transition-colors hover:bg-surface/60">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
                      {initials(reservation.guest_name)}
                    </span>
                    <span className="text-sm font-medium text-ink">{reservation.guest_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-ink">{propertyName(reservation.property_id)}</td>
                <td className="px-5 py-3.5 text-sm text-ink">
                  {formatRange(reservation)}
                  <span className="block text-xs text-ink-muted">{nightsOf(reservation)} noches</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-ink">{getChannel(reservation.platform).label}</td>
                <td className="px-5 py-3.5 text-right text-sm font-medium text-ink">
                  {formatCurrency(grossOf(reservation))}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge
                    status={reservation.status}
                    onChange={onStatusChange ? (newStatus) => onStatusChange(reservation.id, newStatus) : undefined}
                  />
                </td>
                <td className="px-5 py-3.5">{actions(reservation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {reservations.map((reservation) => (
          <li key={reservation.id} className="card-surface space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
                  {initials(reservation.guest_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{reservation.guest_name}</p>
                  <p className="truncate text-xs text-ink-muted">{propertyName(reservation.property_id)}</p>
                </div>
              </div>
              <StatusBadge
                status={reservation.status}
                onChange={onStatusChange ? (newStatus) => onStatusChange(reservation.id, newStatus) : undefined}
              />
            </div>
            <div className="flex items-end justify-between border-t border-line-soft pt-3">
              <div>
                <p className="text-sm text-ink">{formatRange(reservation)}</p>
                <p className="text-xs text-ink-muted">
                  {nightsOf(reservation)} noches, {getChannel(reservation.platform).label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{formatCurrency(grossOf(reservation))}</p>
                {actions(reservation)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
