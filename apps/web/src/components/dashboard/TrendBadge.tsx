import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TrendBadgeProps {
  value: number | null;
  unit?: "%" | " pts";
}

export function TrendBadge({ value, unit = "%" }: TrendBadgeProps) {
  if (value === null) {
    return <span className="text-xs text-ink-muted">Sin periodo previo para comparar</span>;
  }

  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 font-semibold ${
          positive ? "text-teal-600" : "text-coral-accent"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {positive ? "+" : ""}
        {value}
        {unit}
      </span>
      <span className="text-ink-muted">vs periodo anterior</span>
    </span>
  );
}
