"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import type { CalendarEvent } from "@/hooks/useCalendar";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
  getDay,
  locales: { es },
});

const messages = {
  today: "Hoy",
  previous: "Anterior",
  next: "Siguiente",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Reserva",
  allDay: "Reservas",
  noEventsInRange: "No hay reservas en este rango.",
  showMore: (total: number) => `+${total} más`,
};

interface ReservationCalendarProps {
  events: CalendarEvent[];
  date: Date;
  view: View;
  isLoading?: boolean;
  onDateChange: (date: Date) => void;
  onViewChange: (view: View) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function ReservationCalendar({
  events,
  date,
  view,
  isLoading = false,
  onDateChange,
  onViewChange,
  onSelectEvent,
}: ReservationCalendarProps) {
  return (
    <div
      className="nomora-calendar card-surface relative h-[72vh] min-h-[520px] p-4 sm:p-5"
      aria-busy={isLoading}
    >
      <Calendar<CalendarEvent>
        localizer={localizer}
        culture="es"
        messages={messages}
        events={events}
        view={view}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        date={date}
        onView={onViewChange}
        onNavigate={onDateChange}
        onSelectEvent={onSelectEvent}
        tooltipAccessor={(event) => `${event.title} - ${event.propertyName}`}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color,
            color: "#ffffff",
            opacity: event.resource.status === "pending" ? 0.7 : 1,
          },
        })}
        popup
      />
      {isLoading && (
        <div className="pointer-events-none absolute inset-x-5 top-0 h-0.5 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full w-1/3 animate-pulse bg-violet-500" />
        </div>
      )}
    </div>
  );
}
