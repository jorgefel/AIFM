"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { fetcher } from "@/lib/fetcher";
import { PROPERTIES_QUERY_KEY } from "@/hooks/useProperties";
import type { Property, Reservation } from "@/types/models";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [propertyId, setPropertyId] = useState("all");
  useEffect(() => {
    const requestedProperty = new URLSearchParams(window.location.search).get("property_id");
    if (requestedProperty) setPropertyId(requestedProperty);
  }, []);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const { data: properties = [] } = useQuery<Property[]>({ queryKey: PROPERTIES_QUERY_KEY, queryFn: () => fetcher("/properties/") });
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["calendar-reservations", isoDate(monthStart), propertyId],
    queryFn: () => fetcher(`/reservations/calendar?start=${isoDate(monthStart)}&end=${isoDate(monthEnd)}${propertyId === "all" ? "" : `&property_id=${propertyId}`}`),
  });

  const days = useMemo(() => {
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const visibleStart = new Date(monthStart);
    visibleStart.setDate(visibleStart.getDate() - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(visibleStart);
      day.setDate(day.getDate() + index);
      return day;
    });
  }, [monthStart.getFullYear(), monthStart.getMonth()]);

  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const changeMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const today = isoDate(new Date());

  return <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold tracking-tight text-white">Calendario de reservas</h1><p className="mt-1 text-slate-400">Consulta la ocupación de todas tus propiedades en un solo lugar.</p></div>
        <Link href="/income"><Button><Plus className="mr-2 h-4 w-4" />Nueva reserva</Button></Link>
      </div>
      <div className="glass-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><ChevronLeft className="h-5 w-5" /></button><h2 className="min-w-44 text-center font-semibold text-white">{monthNames[month.getMonth()]} {month.getFullYear()}</h2><button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><ChevronRight className="h-5 w-5" /></button></div>
        <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="rounded-lg border border-white/10 bg-obsidian-light/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"><option value="all">Todas las propiedades</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-obsidian-light/20">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-white/10">{weekDays.map((day) => <div key={day} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{day}</div>)}</div>
          <div className="grid grid-cols-7">{days.map((day) => {
            const date = isoDate(day);
            const inMonth = day.getMonth() === month.getMonth();
            const events = reservations.filter((reservation) => reservation.check_in <= date && reservation.check_out > date);
            return <div key={date} className={`min-h-28 border-b border-r border-white/5 p-2 ${inMonth ? "bg-white/[0.01]" : "bg-black/10 text-slate-600"}`}>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${date === today ? "bg-emerald-400 font-bold text-obsidian" : "text-slate-400"}`}>{day.getDate()}</span>
              <div className="mt-1 space-y-1">{events.slice(0, 3).map((reservation) => <div key={`${reservation.id}-${date}`} title={`${reservation.guest_name} · ${propertyById.get(reservation.property_id)?.name ?? "Propiedad"}`} className={`truncate rounded px-1.5 py-1 text-[11px] font-medium ${reservation.status === "pending" ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}>{propertyId === "all" && <span className="mr-1 opacity-70">{propertyById.get(reservation.property_id)?.name}:</span>}{reservation.guest_name}</div>)}</div>
            </div>;
          })}</div>
        </div>
      </div>
      {isLoading && <p className="text-sm text-slate-500">Actualizando reservas…</p>}
      <p className="text-xs text-slate-500">Las reservas confirmadas y pendientes bloquean las fechas; una salida y entrada el mismo día es válida.</p>
    </div>
  </DashboardLayout>;
}
