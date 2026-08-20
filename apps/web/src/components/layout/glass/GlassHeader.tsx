"use client";

import { Menu, LogOut, Settings, User as UserIcon, ChevronDown, Search, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { HeaderSearch } from "../HeaderSearch";
import { HeaderNotifications } from "../HeaderNotifications";

interface GlassHeaderProps {
  onMenuClick?: () => void;
}

export function GlassHeader({ onMenuClick }: GlassHeaderProps = {}) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <div className="bg-transparent">
      <header className="h-16 md:h-20 flex items-center justify-between px-3 sm:px-4 md:px-8 gap-2">
        {/* Izquierda: Menú Móvil y Buscador */}
        <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Botón de Menú (Solo en móvil/tablet) */}
          <button
            onClick={onMenuClick}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/[0.06] text-ink-muted hover:text-violet-600 transition-colors shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Buscador - visible en escritorio/tablet */}
          <div className="hidden md:block">
            <HeaderSearch />
          </div>
        </div>

        {/* Derecha: Acciones y Perfil */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Buscador - icono en móvil */}
          <button
            onClick={() => setIsMobileSearchOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/[0.06] text-ink-muted hover:text-violet-600 transition-colors"
            aria-label="Buscar"
          >
            {isMobileSearchOpen ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
          </button>

          {/* Notificaciones */}
          <HeaderNotifications />

          {/* Avatar Usuario */}
          <div className="relative">
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 cursor-pointer group bg-white pl-1 pr-1 lg:pr-3 py-1 rounded-full shadow-sm border border-black/[0.06] hover:border-violet-200 transition-colors"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-xs font-bold text-white">
                  {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "AD"}
                </span>
              </div>

              <div className="hidden lg:flex flex-col leading-tight">
                <p className="text-sm font-medium text-ink group-hover:text-violet-700 transition-colors">
                  {user?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-ink-muted">
                  {user?.role || "Admin"}
                </p>
              </div>
              <ChevronDown className={`hidden lg:block w-4 h-4 text-ink-muted transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
            </div>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-black/5 rounded-xl shadow-xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <Link
                    href="/settings?tab=profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-ink/80 hover:text-ink hover:bg-surface transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-ink-muted" />
                    Mi Perfil
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-ink/80 hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Settings className="w-4 h-4 text-ink-muted" />
                    Configuración
                  </Link>

                  <div className="h-px bg-black/5 my-1" />

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-coral-accent hover:bg-coral-accent/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Fila de búsqueda expandible en móvil */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden px-3 sm:px-4"
          >
            <div className="pb-3">
              <HeaderSearch />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
