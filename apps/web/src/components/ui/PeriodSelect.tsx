"use client";

import { CalendarDays } from "lucide-react";
import type { DateFilter, DateRangeMode } from "@/lib/metrics";

interface PeriodSelectProps {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  const handleModeChange = (newMode: DateRangeMode) => {
    if (newMode === value.mode) return;
    if (newMode === "days") {
      const startDay = value.start.length === 7 ? `${value.start}-01` : value.start;
      const endDay = value.end.length === 7 ? `${value.end}-28` : value.end;
      onChange({
        mode: "days",
        start: startDay,
        end: endDay,
      });
    } else {
      onChange({
        mode: "months",
        start: value.start.slice(0, 7),
        end: value.end.slice(0, 7),
      });
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card p-1.5 shadow-sm text-sm">
      {/* Selector de modo: Por meses vs Por días */}
      <div className="flex rounded-lg bg-surface/80 p-0.5 border border-line-soft">
        <button
          type="button"
          onClick={() => handleModeChange("months")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            value.mode === "months"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Meses
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("days")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            value.mode === "days"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Días
        </button>
      </div>

      {/* Intervalo de fechas */}
      <div className="flex items-center gap-1.5 px-1 text-xs sm:text-sm text-ink">
        <CalendarDays className="h-4 w-4 text-ink-muted shrink-0" aria-hidden="true" />
        {value.mode === "months" ? (
          <>
            <input
              type="month"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="rounded-md border border-line-soft bg-surface/50 px-2 py-1 text-xs sm:text-sm text-ink outline-none focus:border-violet-500 cursor-pointer"
              aria-label="Mes inicial"
            />
            <span className="text-xs text-ink-muted">hasta</span>
            <input
              type="month"
              value={value.end}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              className="rounded-md border border-line-soft bg-surface/50 px-2 py-1 text-xs sm:text-sm text-ink outline-none focus:border-violet-500 cursor-pointer"
              aria-label="Mes final"
            />
          </>
        ) : (
          <>
            <input
              type="date"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="rounded-md border border-line-soft bg-surface/50 px-2 py-1 text-xs sm:text-sm text-ink outline-none focus:border-violet-500 cursor-pointer"
              aria-label="Fecha inicial"
            />
            <span className="text-xs text-ink-muted">hasta</span>
            <input
              type="date"
              value={value.end}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              className="rounded-md border border-line-soft bg-surface/50 px-2 py-1 text-xs sm:text-sm text-ink outline-none focus:border-violet-500 cursor-pointer"
              aria-label="Fecha final"
            />
          </>
        )}
      </div>
    </div>
  );
}
