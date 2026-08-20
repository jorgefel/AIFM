"use client";

import { GlassLayout } from "./glass/GlassLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout is now a thin alias for GlassLayout so every page in the
 * app (Resumen, Ingresos, Gastos, Propiedades, Reportes, ROI, Configuración)
 * shares a single, modern, fully responsive shell — instead of the two
 * visually inconsistent layouts that existed before.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <GlassLayout>{children}</GlassLayout>;
}
