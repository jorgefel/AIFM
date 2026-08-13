import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Propiedades", description: "Gestiona las propiedades, ubicaciones y monedas de tu portafolio.", path: "/properties" });
export default function PropertiesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
