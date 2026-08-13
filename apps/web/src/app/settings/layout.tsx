import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Configuración de cuenta", description: "Gestiona tu perfil y las preferencias de AIFM.", path: "/settings" });
export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
