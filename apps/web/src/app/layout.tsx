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
  title: "Nomora | Airbnb Intelligent Finance & Management",
  description: "Airbnb Intelligent Finance & Management",
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