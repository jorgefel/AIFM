"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Plus } from "lucide-react";
import type { View } from "react-big-calendar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { ReservationCalendar } from "@/components/calendar/ReservationCalendar";
import { ReservationDetail } from "@/components/calendar/ReservationDetail";
import { useCalendar } from "@/hooks/useCalendar";
import type { Reservation } from "@/types/models";

export default function CalendarPage() {
  const router = useRouter();
  const {
    properties,
    propertyInfo,
    hiddenIds,
    toggleProperty,
    setAllVisible,
    events,
    isLoading,
    updateReservation,
  } = useCalendar();

  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const markedDays = useMemo(() => {
    const days = new Set<string>();
    events.forEach((event) => {
      for (let day = event.start; day < event.end; day = addDays(day, 1)) {
        days.add(format(day, "yyyy-MM-dd"));
      }
    });
    return days;
  }, [events]);

  const allVisible = hiddenIds.size === 0;
  const noneVisible = properties.length > 0 && hiddenIds.size === properties.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Calendario de reservas</h1>
            <p className="mt-1 text-ink-muted">Consulta las reservas de todas tus propiedades por día, semana o mes.</p>
          </div>
          <Button onClick={() => router.push("/reservations?new=1")} className="group shrink-0">
            <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
            Nueva reserva
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="space-y-6">
            <section aria-label="Mini calendario" className="card-surface p-5">
              <MiniCalendar selected={date} marked={markedDays} onSelect={setDate} />
            </section>

            <section aria-labelledby="properties-filter-title" className="card-surface p-5">
              <h2 id="properties-filter-title" className="mb-3 text-sm font-semibold text-ink">
                Propiedades
              </h2>
              {properties.length === 0 ? (
                <p className="text-sm text-ink-muted">No hay propiedades registradas.</p>
              ) : (
                <ul className="space-y-2.5">
                  <li>
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={allVisible}
                        ref={(input) => {
                          if (input) input.indeterminate = !allVisible && !noneVisible;
                        }}
                        onChange={(e) => setAllVisible(e.target.checked)}
                        className="h-4 w-4 accent-violet-500"
                      />
                      Todas las propiedades
                    </label>
                  </li>
                  {properties.map((property) => (
                    <li key={property.id}>
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={!hiddenIds.has(property.id)}
                          onChange={() => toggleProperty(property.id)}
                          className="h-4 w-4 accent-violet-500"
                        />
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: propertyInfo.get(property.id)?.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{property.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <ReservationCalendar
            events={events}
            date={date}
            view={view}
            isLoading={isLoading}
            onDateChange={setDate}
            onViewChange={setView}
            onSelectEvent={(event) => {
              setSelected(event.resource);
              setIsDetailOpen(true);
            }}
          />
        </div>
      </div>

      <ReservationDetail
        key={selected?.id ?? "none"}
        reservation={selected}
        propertyName={selected ? propertyInfo.get(selected.property_id)?.name : undefined}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSave={updateReservation}
      />
    </DashboardLayout>
  );
}
