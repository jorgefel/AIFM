"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderNotifications } from "./HeaderNotifications";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-obsidian/50 backdrop-blur-md sticky top-0 z-10">
      {/* Izquierda: Menú Móvil y Buscador */}
      <div className="flex-1 flex items-center gap-4">
        {/* Botón de Menú (Solo en móvil) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Buscador */}
        <HeaderSearch />
      </div>

      {/* Derecha: Acciones y Perfil */}
      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <HeaderNotifications />

        {/* Avatar Usuario */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/5 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-emerald-500/50 transition-all">
            <span className="text-sm font-bold text-white">
              {user?.full_name ? user.full_name.substring(0,2).toUpperCase() : "AD"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user?.full_name || "Usuario"}</p>
            <button onClick={() => logout()} className="text-xs text-coral-accent hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
