"use client";

import { GlassLayout } from "@/components/layout/glass/GlassLayout";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAIReport } from "@/hooks/useAIReport";

// Glass Components
import { GlassStatCards } from "@/components/dashboard/glass/GlassStatCards";
import { GlassIncome } from "@/components/dashboard/glass/GlassIncome";
import { GlassProperties } from "@/components/dashboard/glass/GlassProperties";
import { GlassAiDecisions } from "@/components/dashboard/glass/GlassAiDecisions";
import { GlassPerformanceChart } from "@/components/dashboard/glass/GlassPerformanceChart";
import { AIReportModal } from "@/components/dashboard/AIReportModal";

export default function Home() {
  const { user } = useAuth();

  const {
    properties,
    selectedPropertyId,
    summary,
    chartData,
    isLoading
  } = useDashboardData();

  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportState,
    reportResult,
    reportError,
    generateReport
  } = useAIReport();

  const firstName = user?.full_name?.split(" ")[0] || "Usuario";
  const currency = properties.find(p => p.id === selectedPropertyId)?.currency || "USD";

  return (
    <GlassLayout>
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          ¡Bienvenido de vuelta, {firstName}! 👋
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          Aquí tienes el resumen de tu negocio hoy.
        </p>
      </div>

      {/* Empty state */}
      {!selectedPropertyId && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-surface p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-2">Bienvenido a Nomora</h3>
          <p className="text-ink-muted max-w-md text-sm">
            Aún no tienes propiedades registradas. Para comenzar a ver tu resumen financiero, primero añade tu primera propiedad.
          </p>
          <button
            onClick={() => window.location.href='/properties'}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 text-white font-medium rounded-full transition-all shadow-lg shadow-violet-500/25"
          >
            Añadir Propiedad
          </button>
        </motion.div>
      )}

      {/* Row 1: Tarjetas de estadísticas */}
      <GlassStatCards
        grossIncome={summary?.gross_income ?? null}
        occupancyRate={summary?.occupancy_rate ?? null}
        netProfit={summary?.net_profit ?? null}
        totalExpenses={summary?.total_expenses ?? null}
      />

      {/* Row 2: Ingresos + Decisiones IA + Propiedades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="min-h-[220px]">
          <GlassIncome
            grossIncome={summary?.gross_income ?? null}
            currency={currency}
          />
        </div>
        <div className="min-h-[220px]">
          <GlassAiDecisions
            onExplore={() => generateReport(selectedPropertyId)}
          />
        </div>
        <div className="min-h-[220px] lg:row-span-1">
          <GlassProperties properties={properties} />
        </div>
      </div>

      {/* Row 3: Rendimiento Portafolio (Full Width) */}
      <div className="h-[420px]">
        <GlassPerformanceChart chartData={chartData} isLoading={isLoading} />
      </div>

      {/* AI Report Modal */}
      <AIReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportState={reportState} 
        reportResult={reportResult} 
        reportError={reportError} 
      />
    </GlassLayout>
  );
}
