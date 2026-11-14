"use client";

import { GlassSidebar } from "./GlassSidebar";
import { GlassHeader } from "./GlassHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { ProtectedRoute } from "../../auth/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { AIChatCopilot } from "../../chat/AIChatCopilot";

interface GlassLayoutProps {
  children: React.ReactNode;
}

export function GlassLayout({ children }: GlassLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cierre de sesión automático tras inactividad
  useAutoLogout();

  return (
    <ProtectedRoute>
      {/* Fondo claro de la app */}
      <div className="flex h-screen-safe overflow-hidden bg-surface relative">

        {/* Resplandores violeta y fucsia detrás del contenido */}
        <div className="app-glow-a absolute top-[-18%] right-[-6%] w-[42%] h-[48%] rounded-full blur-[110px] pointer-events-none" />
        <div className="app-glow-b absolute bottom-[-20%] left-[18%] w-[38%] h-[42%] rounded-full blur-[120px] pointer-events-none" />

        {/* Sidebar oscuro flotante (desktop/tablet) */}
        <div className="hidden md:flex shrink-0 py-3 pl-3">
          <GlassSidebar />
        </div>

        {/* Overlay de sidebar en móvil */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 md:hidden flex p-3"
              >
                <GlassSidebar onClose={() => setIsMobileMenuOpen(false)} expanded />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
          <GlassHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-24 sm:px-5 sm:pt-5 md:px-8 md:py-6 relative z-1 scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Widget flotante de Copiloto IA */}
          <AIChatCopilot />
        </div>

        <MobileBottomNav onMore={() => setIsMobileMenuOpen(true)} />
      </div>
    </ProtectedRoute>
  );
}
