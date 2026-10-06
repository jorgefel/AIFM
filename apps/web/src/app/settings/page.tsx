"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { User, Mail, Shield, LogOut, Globe, Crown } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { AppearanceSection } from "@/components/settings/AppearanceSection";

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      toast.success("Guardado", "Tus cambios se guardaron correctamente.");
    } catch {
      toast.error("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
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
            <Link href="/plans" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-xl font-medium transition-colors">
              <Crown className="w-5 h-5 text-amber-300" />
              Plan y facturación
            </Link>
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

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        maxLength={150}
                        className="w-full bg-obsidian-light/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
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

                <AppearanceSection />

                {/* Preferencias Globales */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-teal-400" />
                    Preferencias Regionales
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Moneda Principal</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="w-full bg-obsidian-light/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="COP">Peso Colombiano (COP)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Esta moneda se utilizará para mostrar todos los valores financieros en la aplicación.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-teal-400" />
                    Integraciones y Canales
                  </h4>
                  
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <p className="font-medium text-white flex items-center gap-2">
                        Gestor de Canales (Channel Manager)
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">PRO</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Sincroniza Airbnb, Booking y VRBO a través de Beds24.
                      </p>
                    </div>
                    <Link href="/settings/integrations" className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                      Configurar
                    </Link>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <Button type="button" variant="ghost" className="text-coral-accent border-coral-accent/30 hover:bg-coral-accent/10 hover:border-coral-accent" onClick={() => logout()}><LogOut className="w-4 h-4 mr-2" />Cerrar Sesión</Button>
                  <Button type="submit" isLoading={saving}>Guardar cambios</Button>
                </div>
              </form>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
