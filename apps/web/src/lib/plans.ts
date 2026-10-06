export type PlanId = "free" | "pro";

export interface PlanFeature {
  label: string;
  free: boolean;
  pro: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Propiedades con ficha completa", free: true, pro: true },
  { label: "Calendario y reservas manuales", free: true, pro: true },
  { label: "Ingresos y gastos con panel financiero", free: true, pro: true },
  { label: "Análisis determinístico y exportaciones", free: true, pro: true },
  { label: "Sincronización y migración de plataformas", free: false, pro: true },
  { label: "Agente de IA para análisis y acciones", free: false, pro: true },
  { label: "Automatizaciones operativas", free: false, pro: true },
];
