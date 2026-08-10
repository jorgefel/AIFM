"use client";

import { GlassSidebar } from "./GlassSidebar";
import { GlassHeader } from "./GlassHeader";
import { ProtectedRoute } from "../../auth/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface GlassLayoutProps {
  children: React.ReactNode;
}

export function GlassLayout({ children }: GlassLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      {/* FULL SCREEN BACKGROUND (Deep black with subtle radial glows) */}
      <div className="flex h-screen overflow-hidden bg-[#0A0A0F] relative p-0 sm:p-4 md:p-6 lg:p-8">
        
        {/* Glow Effects in background */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-pink-600/10 blur-[150px] pointer-events-none" />

        {/* MASSIVE GLASS CONTAINER */}
        <div className="flex-1 flex flex-row overflow-hidden relative rounded-none sm:rounded-[24px] border-none sm:border border-white/10 bg-[rgba(20,20,25,0.55)] backdrop-blur-[20px] shadow-2xl">
          
          {/* Desktop Sidebar */}
          <div className="hidden md:block shrink-0">
            <GlassSidebar />
          </div>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-y-0 left-0 z-50 md:hidden flex bg-[#141419]"
                >
                  <GlassSidebar onClose={() => setIsMobileMenuOpen(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <GlassHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
            
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-1 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="max-w-7xl mx-auto space-y-6"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
