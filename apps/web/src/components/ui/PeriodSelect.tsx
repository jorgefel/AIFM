"use client";

import { CalendarDays } from "lucide-react";
import { PERIOD_OPTIONS, type PeriodId } from "@/lib/metrics";

interface PeriodSelectProps {
  value: PeriodId;
  onChange: (value: PeriodId) => void;
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink shadow-sm">
      <CalendarDays className="h-4 w-4 text-ink-muted" aria-hidden="true" />
      <span className="sr-only">Periodo</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodId)}
        className="cursor-pointer bg-transparent text-sm focus:outline-none"
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-card text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
