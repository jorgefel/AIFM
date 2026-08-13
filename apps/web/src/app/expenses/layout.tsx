import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Gastos operativos", description: "Registra y controla los gastos operativos de tus propiedades.", path: "/expenses" });
export default function ExpensesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
