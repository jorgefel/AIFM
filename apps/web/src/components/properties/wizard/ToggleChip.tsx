import { Check, type LucideIcon } from "lucide-react";

interface ToggleChipProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: LucideIcon;
}

export function ToggleChip({ checked, onChange, label, icon: Icon }: ToggleChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
        checked
          ? "border-violet-400 bg-violet-50 text-violet-700"
          : "border-line bg-card text-ink hover:bg-surface"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{label}</span>
      {checked && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}
