"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Shield, Key, Lock, Laptop } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";

export default function SecuritySettingsPage() {
  useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      toast.warning("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    setSaving(true);
    try {
      await api.put("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success("Contraseña actualizada con éxito");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Error", error.response?.data?.detail || "No se pudo actualizar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-400" />
          Seguridad y Acceso
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona tu contraseña, sesiones activas y autenticación en dos pasos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cambiar Contraseña */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
            <div className="rounded-xl bg-white/5 p-2 text-slate-300">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cambiar Contraseña</h3>
              <p className="text-xs text-slate-400">Asegúrate de usar una contraseña segura.</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña Actual</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nueva Contraseña</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" 
                required minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Contraseña</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" 
                required minLength={8}
              />
            </div>
            <Button type="submit" isLoading={saving} className="w-full mt-2">
              Actualizar Contraseña
            </Button>
          </form>
        </div>

        {/* Sesiones y Seguridad */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <div className="rounded-xl bg-white/5 p-2 text-slate-300">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sesiones Activas</h3>
                <p className="text-xs text-slate-400">Dispositivos donde has iniciado sesión.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
              <div>
                <p className="text-sm font-medium text-emerald-300">Este dispositivo (Actual)</p>
                <p className="text-xs text-emerald-300/70">Sesión iniciada recientemente</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </div>
            <Button variant="secondary" className="w-full mt-4 text-xs">Cerrar todas las demás sesiones</Button>
          </div>
          
          <div className="glass-panel p-6">
             <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2 text-slate-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Autenticación en 2 Pasos (2FA)</h3>
                <p className="text-xs text-slate-400 mt-1">Próximamente disponible para cuentas Pro.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
