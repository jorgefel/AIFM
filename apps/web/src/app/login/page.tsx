"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-teal-500/10 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="w-full max-w-md p-8 glass-panel-interactive relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-2">Bienvenido a AIFM</h2>
        <p className="text-center text-slate-400 mb-8">Inicia sesión en tu cuenta</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-obsidian-light/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-obsidian-light/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Crear Cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

