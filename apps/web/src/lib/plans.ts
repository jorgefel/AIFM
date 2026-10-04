export type PlanId = "free" | "pro";
export type BillingPeriod = "monthly" | "yearly";

// Valores de referencia: el precio final lo define el proveedor de pagos
export const PRO_PRICING = {
  currency: "USD",
  monthly: 19,
  yearly: 190,
} as const;

export interface PlanFeature {
  label: string;
  free: boolean;
  pro: boolean;
  soon?: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Propiedades con ficha completa y galería", free: true, pro: true },
  { label: "Calendario y reservas manuales", free: true, pro: true },
  { label: "Ingresos y gastos con filtros y resumen mensual", free: true, pro: true },
  { label: "Huéspedes e historial de estadías", free: true, pro: true },
  { label: "Dashboard, análisis y reportes", free: true, pro: true },
  { label: "Sincronización con Airbnb y Booking.com", free: false, pro: true, soon: true },
  { label: "Disponibilidad y precios sincronizados en el calendario", free: false, pro: true, soon: true },
  { label: "Asistente de IA sobre los datos de tu negocio", free: false, pro: true, soon: true },
  { label: "Automatizaciones con aprobación previa", free: false, pro: true, soon: true },
];

export const PLAN_NAMES: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
};

export function formatPlanPrice(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: PRO_PRICING.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function getProPrice(billing: BillingPeriod): number {
  return PRO_PRICING[billing];
}

export function getYearlySavingsPercent(): number {
  const fullYear = PRO_PRICING.monthly * 12;
  return Math.round((1 - PRO_PRICING.yearly / fullYear) * 100);
}

export function isBillingPeriod(value: string | null): value is BillingPeriod {
  return value === "monthly" || value === "yearly";
}
