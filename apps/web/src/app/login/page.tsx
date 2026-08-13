"use client";

import { useState, useEffect, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PixelBlast = dynamic(() => import("@/components/PixelBlast"), { ssr: false });

const RegisterLink = memo(function RegisterLink() {
  return (
    <Link
      href="/register"
      prefetch={false}
      className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
    >
      Crear Cuenta
    </Link>
  );
});

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

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

  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-glows relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden z-0">
        <PixelBlast
          variant="circle"
          pixelSize={5}
          color="#8B5CF6"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.2}
          liquid={false}
          speed={0.4}
          edgeFade={0.3}
          transparent
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
        className="w-full max-w-md p-8 relative z-10 rounded-2xl border border-white/[0.08] bg-[rgba(20,20,25,0.55)] shadow-2xl backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 flex items-center justify-center text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-center text-white mb-2">Bienvenido a AIFM</h1>
          <p className="text-center text-slate-400 mb-8">Inicia sesión en tu cuenta</p>
        </motion.div>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-obsidian-light/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-obsidian-light/50 border border-white/10 rounded-lg px-4 py-2.5 pr-11 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-medium py-2.5 px-4 rounded-full transition-all mt-6 disabled:opacity-50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </motion.form>

        <p className="text-center text-slate-500 text-sm mt-6">
          ¿No tienes cuenta? <RegisterLink />
        </p>
      </motion.div>
    </div>
  );
}
