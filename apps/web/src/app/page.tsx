"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { GlassLayout } from "@/components/layout/glass/GlassLayout";
import { PeriodSelect } from "@/components/ui/PeriodSelect";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { PortfolioStatCards } from "@/components/dashboard/PortfolioStatCards";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { PropertySummaryGrid } from "@/components/dashboard/PropertySummaryGrid";
import { PromoBanner } from "@/components/dashboard/PromoBanner";
import { ChannelBars } from "@/components/analytics/ChannelBars";
import { PredictiveRecommendations } from "@/components/dashboard/PredictiveRecommendations";
import { NonInvasiveBottomAd } from "@/components/dashboard/NonInvasiveAds";
import { AIReportModal } from "@/components/dashboard/AIReportModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAIReport } from "@/hooks/useAIReport";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { useForecast } from "@/hooks/useForecast";
import { pctChange, getDefaultDateFilter, type DateFilter } from "@/lib/metrics";

export default function Home() {
  const router = useRouter();
  const { user, isPro } = useAuth();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const [period, setPeriod] = useState<DateFilter>(getDefaultDateFilter);

  const { properties, current, previous, series, isLoading } = usePortfolioMetrics(period);
  const activePropertyId = properties[0]?.id;
  const { data: forecastData } = useForecast(activePropertyId, 3);
  const nextMonthForecast = forecastData?.forecasts?.[0];

  const nextMonthName = useMemo(() => {
    if (!nextMonthForecast?.month) return "";
    const parts = nextMonthForecast.month.split("-");
    const mIdx = parseInt(parts[1], 10) - 1;
    const names = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${names[mIdx] ?? parts[1]} ${parts[0]}`;
  }, [nextMonthForecast]);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-display text-base font-bold text-ink">Hola, {firstName}</p>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      <DashboardHero
        revenue={current.revenue}
        change={pctChange(current.revenue, previous.revenue)}
        periodLabel="del periodo"
        isLoading={isLoading}
      />

      {!hasProperties && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-surface flex flex-col items-center justify-center p-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Building2 className="h-8 w-8 text-violet-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-ink">Bienvenido a Nomora</h2>
          <p className="max-w-md text-sm text-ink-muted">
            Aún no tienes propiedades registradas. Para empezar a ver tu resumen, añade tu primera
            propiedad.
          </p>
          <button
            onClick={() => router.push("/properties/new")}
            className="mt-6 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-400 hover:to-violet-500"
          >
            Añadir propiedad
          </button>
        </motion.div>
      )}

      <PortfolioStatCards current={current} previous={previous} isLoading={isLoading} />

      {/* Expectativa predictiva para el próximo mes */}
      {nextMonthForecast && (
        <div className="card-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-violet-500 bg-surface/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  Expectativa para el próximo mes ({nextMonthName})
                </span>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20">
                  {forecastData?.confidence_level === "high"
                    ? "Alta confianza"
                    : forecastData?.confidence_level === "medium"
                    ? "Confianza media"
                    : "Estimación inicial"}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Estimación estadística basada en el historial de {forecastData?.property_name || "tu propiedad"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 divide-x divide-line-soft">
            <div className="pl-0">
              <p className="text-[11px] text-ink-muted">Ingresos esperados</p>
              <p className="text-sm sm:text-base font-bold text-ink">
                {formatCurrency(nextMonthForecast.projected_gross_income)}
              </p>
              <p className="text-[10px] text-ink-muted truncate">
                Rango: {formatCurrencyCompact(nextMonthForecast.gross_income_min)} - {formatCurrencyCompact(nextMonthForecast.gross_income_max)}
              </p>
            </div>
            <div className="pl-3 sm:pl-6">
              <p className="text-[11px] text-ink-muted">Ganancia neta estimada</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400">
                {formatCurrency(nextMonthForecast.projected_net_profit)}
              </p>
              <p className="text-[10px] text-ink-muted truncate">
                Min: {formatCurrencyCompact(nextMonthForecast.net_profit_min)}
              </p>
            </div>
            <div className="pl-3 sm:pl-6">
              <p className="text-[11px] text-ink-muted">Reservas esperadas</p>
              <p className="text-sm sm:text-base font-bold text-ink">
                ~{nextMonthForecast.projected_reservations ?? 0}
              </p>
              <p className="text-[10px] text-ink-muted truncate">
                {nextMonthForecast.booked_reservations
                  ? `${nextMonthForecast.booked_reservations} confirmadas`
                  : "0 en libros"}
              </p>
            </div>
          </div>
        </div>
      )}

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
          recommendations={forecastData?.recommendations}
          forecast={forecastData?.forecasts}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertySummaryGrid properties={properties} stats={current.byProperty} />
        </div>
        <div className="min-h-[220px]">
          <ChannelBars channels={current.channels} />
        </div>
      </div>

      {!isPro && <PromoBanner />}

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
