"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center text-slate-500">
          Cargando configuración...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
        
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Configuración de la Cuenta</h1>
          <p className="text-slate-400 mt-1">Gestiona tu perfil y las preferencias de la aplicación.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Navegación lateral de settings */}
          <div className="col-span-1 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium transition-colors border border-emerald-500/20">
              <User className="w-5 h-5" />
              Perfil de Usuario
            </button>
            <button disabled className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed">
              <Shield className="w-5 h-5" />
              Seguridad (Próximamente)
            </button>
          </div>

          {/* Formulario / Detalles */}
          <div className="col-span-1 md:col-span-2">
            <div className="glass-panel p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center overflow-hidden border-4 border-obsidian shadow-xl shadow-black/50">
                  <span className="text-2xl font-bold text-white">
                    {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : "US"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.full_name || "Usuario"}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-semibold capitalize">
                      {user.role || "Owner"}
                    </span>
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input 
                        type="text" 
                        defaultValue={user.full_name || ""} 
                        disabled
                        className="w-full bg-obsidian-light/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-colors opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500" />
                      </div>
                      <input 
                        type="email" 
                        defaultValue={user.email} 
                        disabled
                        className="w-full bg-obsidian-light/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-colors opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <p className="text-xs text-slate-500 max-w-xs">
                    La edición de perfil se habilitará en una futura actualización.
                  </p>
                  <Button variant="ghost" className="text-coral-accent border-coral-accent/30 hover:bg-coral-accent/10 hover:border-coral-accent" onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
