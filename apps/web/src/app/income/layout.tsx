import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Ingresos y reservas", description: "Consulta los ingresos y las reservas de tus propiedades.", path: "/income" });
export default function IncomeLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
