import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: readonly { id: string; label: string }[];
  current: number;
  onSelect: (index: number) => void;
}

export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-ink-muted sm:hidden">
        Paso {current + 1} de {steps.length}: {steps[current].label}
      </p>
      <ol className="flex items-center gap-2" aria-label="Progreso del formulario">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                disabled={i > current}
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-violet-500 disabled:cursor-default"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(124,92,252,0.3)]"
                      : done
                        ? "bg-violet-100 text-violet-700"
                        : "bg-surface text-ink-muted"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span className={`h-px flex-1 ${done ? "bg-violet-300" : "bg-ink/10"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
