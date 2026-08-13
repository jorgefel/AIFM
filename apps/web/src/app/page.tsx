"use client";

import { GlassLayout } from "@/components/layout/glass/GlassLayout";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Hooks
import { useDashboardData, type PerformanceRange } from "@/hooks/useDashboardData";
import { useAIReport } from "@/hooks/useAIReport";

// Glass Components
import { GlassIncome } from "@/components/dashboard/glass/GlassIncome";
import { GlassProperties } from "@/components/dashboard/glass/GlassProperties";
import { GlassKeyMetrics } from "@/components/dashboard/glass/GlassKeyMetrics";
import { GlassAiDecisions } from "@/components/dashboard/glass/GlassAiDecisions";
import { GlassPerformanceChart } from "@/components/dashboard/glass/GlassPerformanceChart";
import { AIReportModal } from "@/components/dashboard/AIReportModal";

export default function Home() {
  const { user } = useAuth();
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>("6M");

  const {
    properties,
    selectedPropertyId,
    summary,
    chartData,
    isLoading
  } = useDashboardData(performanceRange);

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
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Bienvenido, {firstName}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Resumen de tu portafolio de inversiones inmobiliarias.
        </p>
      </div>

      {/* Empty state */}
      {!selectedPropertyId && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Bienvenido a AIFM</h3>
          <p className="text-slate-400 max-w-md text-sm">
            Aún no tienes propiedades registradas. Para comenzar a ver tu resumen financiero, primero añade tu primera propiedad.
          </p>
          <button
            onClick={() => window.location.href='/properties'}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-medium rounded-full transition-all shadow-lg shadow-purple-500/20"
          >
            Añadir Propiedad
          </button>
        </motion.div>
      )}

      {/* Main Grid: Row 1 - Ingresos + Propiedades + Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Ingresos Brutos + Decisiones IA */}
        <div className="flex flex-col gap-6 h-full">
          <div className="flex-1">
            <GlassIncome
              grossIncome={summary?.gross_income ?? null}
              currency={currency}
            />
          </div>
          {/* <div className="flex-1">
            <GlassAiDecisions
              onExplore={() => generateReport(selectedPropertyId)}
            />
          </div> */}
        </div>

        {/* Column 2: Propiedades */}
        <div className="min-h-[380px]">
          <GlassProperties properties={properties} />
        </div>

        {/* Column 3: Métricas Clave */}
        <div className="min-h-[380px]">
          <GlassKeyMetrics
            netProfit={summary?.net_profit ?? null}
            occupancyRate={summary?.occupancy_rate ?? null}
            totalExpenses={summary?.total_expenses ?? null}
          />
        </div>
      </div>

      {/* Row 2: Rendimiento Portafolio (Full Width) */}
      <div className="h-[420px]">
        <GlassPerformanceChart
          chartData={chartData}
          isLoading={isLoading}
          selectedRange={performanceRange}
          onRangeChange={setPerformanceRange}
        />
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
