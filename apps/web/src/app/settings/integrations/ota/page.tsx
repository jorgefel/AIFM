"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Crown, AlertTriangle, CheckCircle, RefreshCw, HelpCircle, ExternalLink, Home } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants } from "@/lib/animations";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useProperties } from "@/hooks/useProperties";

type OtaStatus = "pending" | "waiting_action" | "connected" | "error";

export default function OtaSetupPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isPro = user?.tier === "pro";
  const { properties } = useProperties();
  
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedOta, setSelectedOta] = useState<"airbnb" | "booking" | null>(null);
  const [step, setStep] = useState<"select_property" | "select_ota" | "airbnb_flow" | "booking_flow" | "connecting" | "status" | "help">("select_property");
  const [status, setStatus] = useState<OtaStatus>("pending");

  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, selectedProperty]);

  const handleConnectAirbnb = async () => {
    setStep("connecting");
    try {
      const response = await api.post("/integrations/ota-connections", {
        property_id: selectedProperty,
        beds24_property_link_id: "00000000-0000-0000-0000-000000000000", // In reality, fetch actual link ID
        ota_name: "airbnb",
      });
      setStatus("connected");
      setStep("status");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setStep("status");
    }
  };

  const handleConnectBooking = async () => {
    setStep("connecting");
    try {
      const response = await api.post("/integrations/ota-connections", {
        property_id: selectedProperty,
        beds24_property_link_id: "00000000-0000-0000-0000-000000000000", // Mock
        ota_name: "booking",
      });
      setStatus("waiting_action");
      setStep("status");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setStep("status");
    }
  };

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/settings/integrations" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Gestor de Canales
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Conectar OTA (Airbnb/Booking)</h1>
          </div>
          <Button variant="ghost" className="text-slate-400" onClick={() => setStep("help")}>
            <HelpCircle className="w-5 h-5 mr-2" />
            Ayuda
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-obsidian/80 backdrop-blur-xl p-8 relative overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {step === "select_property" && (
              <motion.div key="select_property" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-semibold text-white mb-6">1. Selecciona tu propiedad</h2>
                <div className="space-y-4 max-w-lg">
                  <select 
                    className="w-full bg-obsidian-light/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {properties.length === 0 && <option value="">No tienes propiedades registradas</option>}
                  </select>
                  <Button onClick={() => setStep("select_ota")} disabled={!selectedProperty} className="w-full">Continuar</Button>
                </div>
              </motion.div>
            )}

            {step === "select_ota" && (
              <motion.div key="select_ota" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-semibold text-white mb-6">2. Selecciona el canal a conectar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <button 
                    onClick={() => { setSelectedOta("airbnb"); setStep("airbnb_flow"); }}
                    className="flex flex-col items-center justify-center p-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#FF5A5F]/20 flex items-center justify-center mb-4">
                      <Home className="w-8 h-8 text-[#FF5A5F]" />
                    </div>
                    <span className="font-semibold text-white">Airbnb</span>
                  </button>
                  <button 
                    onClick={() => { setSelectedOta("booking"); setStep("booking_flow"); }}
                    className="flex flex-col items-center justify-center p-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#003580]/20 flex items-center justify-center mb-4">
                      <Home className="w-8 h-8 text-[#003580]" />
                    </div>
                    <span className="font-semibold text-white">Booking.com</span>
                  </button>
                </div>
                <Button variant="ghost" onClick={() => setStep("select_property")} className="mt-8">Atrás</Button>
              </motion.div>
            )}

            {step === "airbnb_flow" && (
              <motion.div key="airbnb" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Conectar con Airbnb</h2>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-300">Restricción de Co-Host</h4>
                      <p className="text-sm text-amber-100/70 mt-1">
                        La API oficial de Airbnb no permite conectar propiedades donde solo eres coanfitrión. 
                        Asegúrate de iniciar sesión con la cuenta principal del titular del anuncio.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mb-8">
                  Serás redirigido a Airbnb para autorizar la conexión. Una vez autorizado, Nomora podrá sincronizar tus reservas y precios automáticamente.
                </p>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep("select_ota")}>Atrás</Button>
                  <Button onClick={handleConnectAirbnb} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                    Autorizar en Airbnb <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "booking_flow" && (
              <motion.div key="booking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Conectar con Booking.com</h2>
                <div className="space-y-4 text-slate-300 mb-8">
                  <p>Para conectar Booking.com, debes iniciar la conexión desde tu Extranet:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                    <li>Inicia sesión en la <a href="https://admin.booking.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Extranet de Booking.com</a>.</li>
                    <li>Ve a <strong>Cuenta</strong> &gt; <strong>Proveedor de conectividad (Channel Manager)</strong>.</li>
                    <li>Busca <strong>Beds24</strong> (nuestro socio tecnológico) y selecciónalo.</li>
                    <li>Acepta los términos. Booking.com nos enviará una notificación.</li>
                  </ol>
                  <p className="mt-4">
                    Una vez que hayas completado estos pasos, haz clic en el botón de abajo para que Nomora verifique la solicitud.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep("select_ota")}>Atrás</Button>
                  <Button onClick={handleConnectBooking} className="bg-[#003580] hover:bg-[#003580]/90 text-white">
                    Ya completé los pasos <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "connecting" && (
              <motion.div key="connecting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="text-center max-w-lg mx-auto py-12">
                <RefreshCw className="h-12 w-12 text-teal-400 animate-spin mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-white mb-2">Verificando conexión...</h2>
                <p className="text-slate-400">Estamos hablando con el canal para confirmar el acceso.</p>
              </motion.div>
            )}

            {step === "status" && (
              <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center max-w-lg mx-auto py-12">
                {status === "connected" && (
                  <>
                    <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">¡Conexión Exitosa!</h2>
                    <p className="text-slate-300 mb-8">El canal está conectado. Ahora comenzaremos a sincronizar el calendario.</p>
                  </>
                )}
                {status === "waiting_action" && (
                  <>
                    <RefreshCw className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Esperando confirmación de Booking.com</h2>
                    <p className="text-slate-300 mb-8">
                      Hemos recibido tu solicitud. Nuestro equipo técnico aprobará la conexión en breve. 
                      Recibirás una notificación en la Extranet cuando esté lista para activarse.
                    </p>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertTriangle className="h-16 w-16 text-coral-accent mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Ocurrió un error</h2>
                    <p className="text-slate-300 mb-8">
                      No pudimos establecer la conexión. Verifica que tienes permisos de administrador (no co-host) y vuelve a intentarlo.
                    </p>
                    <Button onClick={() => setStep("select_ota")} className="mr-4">Reintentar</Button>
                  </>
                )}
                <Link href="/settings/integrations">
                  <Button variant={status === "error" ? "ghost" : "primary"}>Volver a Integraciones</Button>
                </Link>
              </motion.div>
            )}

            {step === "help" && (
              <motion.div key="help" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Centro de Soporte de Canales</h2>
                <div className="space-y-6">
                  <div className="p-5 rounded-xl border border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white mb-2">Error de Co-anfitrión en Airbnb</h3>
                    <p className="text-slate-300 text-sm">
                      Si recibes un error indicando permisos insuficientes, es probable que tu cuenta de Airbnb sea un "Co-Host". 
                      Debes pedirle al propietario principal que autorice la aplicación.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white mb-2">Booking.com no me permite seleccionar Beds24</h3>
                    <p className="text-slate-300 text-sm">
                      Si ya tienes otro Channel Manager activo, Booking te pedirá desconectarlo antes de seleccionar Beds24. 
                      Asegúrate de no tener conexiones activas con otros sistemas.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setStep("select_property")} className="mt-8">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver al proceso
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
