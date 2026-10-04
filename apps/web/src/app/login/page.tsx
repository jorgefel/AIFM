"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function LoginPage() {
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      // Si no hay conexión con el servidor, entra igual con datos de vista previa.
      loginDemo({ email: email || undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0A14] relative overflow-hidden px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 rounded-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 bg-[#12101F]"
      >
        {/* Panel del formulario */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 p-8 sm:p-10 flex flex-col justify-center"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_4px_12px_rgba(124,92,252,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">Nomora</span>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-1.5">Bienvenido de vuelta</h2>
            <p className="text-slate-400 text-sm mb-8">Inicia sesión para continuar</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all placeholder:text-slate-600"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-white focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all placeholder:text-slate-600"
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
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all mt-2 disabled:opacity-50 shadow-lg shadow-violet-500/25"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">o continúa con</span>
            <div className="h-px flex-1 bg-white/10" />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SocialAuthButtons />
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-slate-500 text-sm mt-8">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Crear Cuenta
            </Link>
          </motion.p>
        </motion.div>

        {/* Panel de ilustración */}
        <div className="hidden lg:block lg:col-span-3 relative min-h-[600px]">
          <AuthShowcasePanel />
        </div>
      </motion.div>
    </div>
  );
}
