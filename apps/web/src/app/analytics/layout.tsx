import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Análisis", description: "Ingresos, ocupación, ADR y RevPAR de tu negocio.", path: "/analytics" });
export default function AnalyticsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
