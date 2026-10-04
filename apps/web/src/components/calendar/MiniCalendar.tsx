"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selected: Date;
  marked: Set<string>;
  onSelect: (date: Date) => void;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function MiniCalendar({ selected, marked, onSelect }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));

  useEffect(() => {
    setViewMonth(startOfMonth(selected));
  }, [selected]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
      }),
    [viewMonth],
  );

  const today = new Date();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-ink">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            aria-label="Mes anterior"
            className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            aria-label="Mes siguiente"
            className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-1 text-[11px] font-medium text-ink-muted" aria-hidden="true">
            {day}
          </span>
        ))}
        {days.map((day) => {
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, viewMonth);
          const hasBooking = marked.has(format(day, "yyyy-MM-dd"));

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={format(day, "d 'de' MMMM yyyy", { locale: es })}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                isSelected
                  ? "bg-violet-500 font-semibold text-white"
                  : isToday
                    ? "font-semibold text-violet-600 ring-1 ring-violet-400"
                    : inMonth
                      ? "text-ink hover:bg-surface"
                      : "text-ink-muted/50 hover:bg-surface"
              }`}
            >
              {format(day, "d")}
              {hasBooking && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-violet-500" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
