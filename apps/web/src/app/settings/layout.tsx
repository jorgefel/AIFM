import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Configuración de cuenta",description: "Gestiona tu perfil y las preferencias de Nomora.", path: "/settings" });
export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
export const metadata: Metadata = createPageMetadata({ title: "Configuración de cuenta", description: "Gestiona tu perfil y las preferencias de Nomora.", path: "/settings" });
export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
