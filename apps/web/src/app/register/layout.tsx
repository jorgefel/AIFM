import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Crear cuenta",
  description: "Crea una cuenta en AIFM y empieza a gestionar tus propiedades de alquiler.",
  path: "/register",
  isPublic: true,
});

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
