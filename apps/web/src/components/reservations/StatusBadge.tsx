const STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "border-teal-200 bg-teal-50 text-teal-700" },
  pending: { label: "Pendiente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  completed: { label: "Completada", className: "border-violet-200 bg-violet-50 text-violet-700" },
  cancelled: { label: "Cancelada", className: "border-red-200 bg-red-50 text-red-700" },
};

export function getStatusLabel(status: string): string {
  return STATUS[status]?.label ?? status;
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS[status] ?? { label: status, className: "border-line bg-surface text-ink-muted" };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
