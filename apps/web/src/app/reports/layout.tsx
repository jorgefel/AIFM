import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Reportes y análisis", description: "Exporta datos y genera análisis de tus propiedades.", path: "/reports" });
export default function ReportsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
