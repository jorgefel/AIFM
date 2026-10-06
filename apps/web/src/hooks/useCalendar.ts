"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getPropertyColor } from "@/lib/propertyColors";
import { PORTFOLIO_QUERY_KEY, usePortfolio } from "./usePortfolio";
import type { Reservation } from "@/types/models";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  propertyName: string;
  resource: Reservation;
}

export interface ReservationPatch {
  guest_name?: string;
  notes?: string;
}

function toLocalDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T00:00:00` : value);
}

export function useCalendar() {
  const { isDemoMode } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { properties, reservations, isLoading } = usePortfolio();

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [demoPatches, setDemoPatches] = useState<Record<string, ReservationPatch>>({});

  const propertyInfo = useMemo(() => {
    const info = new Map<string, { name: string; color: string }>();
    properties.forEach((p, i) => info.set(p.id, { name: p.name, color: getPropertyColor(i) }));
    return info;
  }, [properties]);

  const merged = useMemo(
    () => reservations.map((r) => (demoPatches[r.id] ? { ...r, ...demoPatches[r.id] } : r)),
    [reservations, demoPatches],
  );

  const events = useMemo<CalendarEvent[]>(
    () =>
      merged
        .filter((r) => r.status !== "cancelled" && !hiddenIds.has(r.property_id))
        .map((r) => {
          const start = toLocalDate(r.check_in);
          const checkOut = toLocalDate(r.check_out);
          const info = propertyInfo.get(r.property_id);
          return {
            id: r.id,
            title: r.guest_name,
            start,
            end: checkOut > start ? checkOut : addDays(start, 1),
            allDay: true,
            color: info?.color ?? getPropertyColor(0),
            propertyName: info?.name ?? "Propiedad",
            resource: r,
          };
        }),
    [merged, hiddenIds, propertyInfo],
  );

  const toggleProperty = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAllVisible = useCallback((visible: boolean) => {
    setHiddenIds(visible ? new Set() : new Set(properties.map((p) => p.id)));
  }, [properties]);

  const updateReservation = async (id: string, patch: ReservationPatch) => {
    try {
      if (isDemoMode) {
        setDemoPatches((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
      } else {
        await api.put(`/reservations/${id}`, patch);
        await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      }
      toast.success("Reserva actualizada", "Los datos del huésped se guardaron.");
      return true;
    } catch {
      toast.error("Error", "No se pudieron guardar los cambios.");
      return false;
    }
  };

  return {
    properties,
    propertyInfo,
    hiddenIds,
    toggleProperty,
    setAllVisible,
    events,
    isLoading,
    updateReservation,
  };
}
