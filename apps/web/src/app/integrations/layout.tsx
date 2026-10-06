import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Integraciones", description: "Conecta Nomora con las herramientas que usas.", path: "/integrations" });
export default function IntegrationsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
