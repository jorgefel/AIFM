"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Crown, AlertTriangle, CheckCircle, RefreshCw, Link as LinkIcon, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isPro = user?.tier === "pro";
  
  const [step, setStep] = useState<"intro" | "checking" | "success" | "error">("intro");
  
  const handleConnect = async () => {
    if (!isPro) return;
    
    setStep("checking");
    try {
      const response = await api.get("/api/v1/integrations/beds24/properties");
      if (response.data.status === "success" || response.status === 200) {
        setStep("success");
      } else {
        throw new Error("No se pudo establecer la conexión");
      }
    } catch (error) {
      console.error(error);
      setStep("error");
      toast.error("Error de conexión", "No pudimos conectar con los canales. Intenta de nuevo.");
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/settings" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Ajustes
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Gestor de Canales</h1>
          </div>
          {!isPro && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <Crown className="mr-1.5 h-4 w-4" />
              Disponible para Pro
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-obsidian/80 backdrop-blur-xl p-8 relative overflow-hidden min-h-[400px] flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center max-w-lg mx-auto"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                  <LinkIcon className="h-10 w-10 text-teal-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-3">¿Quieres migrar tus plataformas?</h2>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  Conecta y centraliza tus reservas de Airbnb, Booking.com, Vrbo y otros canales automáticamente. Evita overbookings y gestiona todo desde Nomora.
                </p>
                
                {isPro ? (
                  <Button onClick={handleConnect} className="w-full sm:w-auto px-8" size="lg">
                    Conectar Canales
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-left">
                    <div className="flex gap-3">
                      <Crown className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-white">Sincronización en tiempo real</h4>
                        <p className="text-sm text-slate-400 mt-1 mb-3">Sube a un plan Pro para desbloquear el gestor de canales y la sincronización con Beds24.</p>
                        <Link href="/plans">
                          <Button variant="secondary" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            Ver planes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "checking" && (
              <motion.div 
                key="checking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center max-w-lg mx-auto"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <RefreshCw className="h-12 w-12 text-teal-400 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Conectando canales...</h2>
                <p className="text-slate-400">
                  Estamos estableciendo una conexión segura. Esto tomará unos segundos.
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center max-w-lg mx-auto"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">¡Conexión establecida!</h2>
                <p className="text-slate-300 mb-8">
                  El conector está activo. Pronto comenzaremos a sincronizar el inventario y las reservas de tus propiedades.
                </p>
                <Button variant="secondary" onClick={() => setStep("intro")} className="w-full sm:w-auto">
                  Ver estado
                </Button>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center max-w-lg mx-auto"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral-accent/10">
                  <AlertTriangle className="h-10 w-10 text-coral-accent" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No pudimos conectar</h2>
                <p className="text-slate-300 mb-8">
                  Ocurrió un error al intentar establecer la conexión con Beds24. Es posible que el servidor de integración no esté disponible.
                </p>
                <Button onClick={handleConnect} className="w-full sm:w-auto">
                  Reintentar conexión
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
