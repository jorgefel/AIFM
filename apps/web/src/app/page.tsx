"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { GlassLayout } from "@/components/layout/glass/GlassLayout";
import { PeriodSelect } from "@/components/ui/PeriodSelect";
import { PortfolioStatCards } from "@/components/dashboard/PortfolioStatCards";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { PropertySummaryGrid } from "@/components/dashboard/PropertySummaryGrid";
import { ChannelDonut } from "@/components/analytics/ChannelDonut";
import { PredictiveRecommendations } from "@/components/dashboard/PredictiveRecommendations";
import { NonInvasiveBottomAd } from "@/components/dashboard/NonInvasiveAds";
import { AIReportModal } from "@/components/dashboard/AIReportModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAIReport } from "@/hooks/useAIReport";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { useForecast } from "@/hooks/useForecast";
import { pctChange, type PeriodId } from "@/lib/metrics";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodId>("month");

  const { properties, current, previous, series, isLoading } = usePortfolioMetrics(period);
  const activePropertyId = properties[0]?.id;
  const { data: forecastData } = useForecast(activePropertyId, 3);

  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportState,
    reportResult,
    reportError,
    generateReport,
  } = useAIReport();

  const firstName = user?.full_name?.split(" ")[0] || "Usuario";
  const hasProperties = properties.length > 0;

  return (
    <GlassLayout>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            ¡Bienvenido de vuelta, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Aquí tienes el resumen de tu negocio.</p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {!hasProperties && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-surface flex flex-col items-center justify-center p-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Building2 className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-ink">Bienvenido a Nomora</h3>
          <p className="max-w-md text-sm text-ink-muted">
            Aún no tienes propiedades registradas. Para empezar a ver tu resumen, añade tu primera
            propiedad.
          </p>
          <button
            onClick={() => router.push("/properties/new")}
            className="mt-6 rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-6 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-400 hover:to-violet-600"
          >
            Añadir propiedad
          </button>
        </motion.div>
      )}

      <PortfolioStatCards current={current} previous={previous} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendChart
            data={series}
            total={current.revenue}
            change={pctChange(current.revenue, previous.revenue)}
            isLoading={isLoading}
            forecast={forecastData?.forecasts}
          />
        </div>
        <PredictiveRecommendations
          forecast={forecastData?.forecasts}
          currentRevenue={current.revenue}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertySummaryGrid properties={properties} stats={current.byProperty} />
        </div>
        <div className="min-h-[220px]">
          <ChannelDonut channels={current.channels} total={current.revenue} />
        </div>
      </div>

      <NonInvasiveBottomAd />

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
