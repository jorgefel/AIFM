import { getYearlySavingsPercent, type BillingPeriod } from "@/lib/plans";

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}

const OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const savings = getYearlySavingsPercent();

  return (
    <div
      role="radiogroup"
      aria-label="Periodo de facturación"
      className="inline-flex rounded-full border border-line-soft bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
              active ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
            {option.value === "yearly" && savings > 0 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                Ahorra {savings}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
