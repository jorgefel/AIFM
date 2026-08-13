import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Iniciar sesión",
  description: "Accede a AIFM para gestionar las finanzas y el rendimiento de tus alojamientos.",
  path: "/login",
  isPublic: true,
});

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
