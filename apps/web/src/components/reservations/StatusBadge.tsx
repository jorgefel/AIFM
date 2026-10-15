import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export const STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100" },
  pending: { label: "Pendiente", className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  completed: { label: "Completada", className: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100" },
  cancelled: { label: "Cancelada", className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
};

export function getStatusLabel(status: string): string {
  return STATUS[status]?.label ?? status;
}

interface StatusBadgeProps {
  status: string;
  onChange?: (newStatus: string) => void;
  disabled?: boolean;
}

export function StatusBadge({ status, onChange, disabled }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = STATUS[status] ?? { label: status, className: "border-line bg-surface text-ink-muted" };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!onChange) {
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Haz clic para cambiar estado"
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all shadow-sm cursor-pointer select-none ${config.className} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
      >
        <span>{config.label}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-36 rounded-xl border border-line-soft bg-card p-1 shadow-xl shadow-black/10 z-50 animate-in fade-in zoom-in-95 duration-100">
          {Object.entries(STATUS).map(([key, item]) => {
            const isSelected = key === status;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (key !== status) {
                    onChange(key);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition-colors ${
                  isSelected ? "bg-surface font-semibold text-ink" : "text-ink-muted hover:bg-surface/80 hover:text-ink"
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
