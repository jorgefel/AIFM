import type { Metadata } from "next";
import { createPageMetadata } from "../metadata";
export const metadata: Metadata = createPageMetadata({ title: "Pago", description: "Completa el pago de tu plan Nomora Pro de forma segura.", path: "/checkout" });
export default function CheckoutLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
