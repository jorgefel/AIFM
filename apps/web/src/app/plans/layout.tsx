import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Planes", description: "Compara los planes Free y Pro de Nomora y elige el que se ajusta a tu operación.", path: "/plans" });
export default function PlansLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
