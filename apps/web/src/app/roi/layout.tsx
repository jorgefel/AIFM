import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Calculadora de ROI", description: "Simula el retorno de inversión de una propiedad de alquiler.", path: "/roi" });
export default function RoiLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
