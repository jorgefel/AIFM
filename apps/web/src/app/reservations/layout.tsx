import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Reservas", description: "Consulta y administra las reservas de todas tus propiedades.", path: "/reservations" });
export default function ReservationsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
