"use client";

import { Menu, LogOut, Settings, User as UserIcon, ChevronDown, Bell } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { HeaderSearch } from "../HeaderSearch";

interface GlassHeaderProps {
  onMenuClick?: () => void;
}

export function GlassHeader({ onMenuClick }: GlassHeaderProps = {}) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-transparent">
      {/* Izquierda: Menú Móvil y Buscador */}
      <div className="flex-1 flex items-center gap-4">
        {/* Botón de Menú (Solo en móvil) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Buscador - Existing Real Component */}
        <HeaderSearch />
      </div>

      {/* Derecha: Acciones y Perfil */}
      <div className="flex items-center gap-6">
        {/* Notificaciones (Dropdown Básico) */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          {isNotificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-3 w-64 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-3 px-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <p className="text-sm font-medium text-white mb-2">Notificaciones</p>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bell className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400">No tienes notificaciones nuevas</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-white/10 hidden md:block" />

        {/* Avatar Usuario */}
        <div className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-tight">
                {user?.full_name || "Usuario"}
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                {user?.email || "usuario@ejemplo.com"}
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-all shadow-lg">
              <span className="text-sm font-bold text-white">
                {user?.full_name ? user.full_name.substring(0,2).toUpperCase() : "AD"}
              </span>
            </div>
            <ChevronDown className={`hidden md:block w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-3 w-56 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <Link 
                  href="/settings?tab=profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Mi Perfil
                </Link>
                
                <Link 
                  href="/settings" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Configuración
                </Link>
                
                <div className="h-px bg-white/5 my-1" />
                
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-pink-400 hover:bg-pink-500/10 transition-colors"
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
  );
}
