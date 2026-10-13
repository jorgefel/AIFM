"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { containerVariants } from "@/lib/animations";
import { Beds24SyncPanel } from "@/components/integrations/Beds24SyncPanel";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const isPro = user?.tier === "pro";

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/settings"
              className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Ajustes
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gestor de Canales
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Conecta Airbnb, Booking.com y sincroniza tu calendario y reservas en tiempo real.
            </p>
          </div>
          {!isPro && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <Crown className="mr-1.5 h-4 w-4" />
              Disponible para Pro
            </span>
          )}
        </div>

        {!isPro ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center max-w-xl mx-auto my-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Crown className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Sincronización de canales en tiempo real</h3>
            <p className="text-sm text-slate-300 mt-2 mb-6">
              Actualiza a Nomora Pro para sincronizar automáticamente tus calendarios y reservas con Airbnb, Booking y más mediante nuestra infraestructura integrada.
            </p>
            <Link href="/plans">
              <Button>Ver planes Pro</Button>
            </Link>
          </div>
        ) : (
          <Beds24SyncPanel isPro={isPro} />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
