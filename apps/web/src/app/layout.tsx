import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

// Fuente principal del sistema
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://aifmweb.vercel.app"),
  title: {
    default: "Resumen financiero | AIFM",
    template: "%s | AIFM",
  },
  description: "Consulta el resumen financiero de tu portafolio de propiedades en AIFM.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable}`}>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <CurrencyProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
