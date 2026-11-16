"use client";

import { useState } from "react";
import { Banknote, BedDouble, Download, Gauge, PieChart, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PeriodSelect } from "@/components/ui/PeriodSelect";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendBadge } from "@/components/dashboard/TrendBadge";
import { ChannelDonut } from "@/components/analytics/ChannelDonut";
import {
  ChannelTable,
  ForecastChart,
  OccupancyLineChart,
  PropertyTable,
  RevenueBarsChart,
  RevenueOccupancyChart,
} from "@/components/analytics/AnalyticsCharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { useForecast } from "@/hooks/useForecast";
import { api } from "@/lib/api";
import { pctChange, pointsChange, getDefaultDateFilter, type DateFilter } from "@/lib/metrics";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "revenue", label: "Ingresos" },
  { id: "occupancy", label: "Ocupación" },
  { id: "channels", label: "Canales" },
  { id: "forecast", label: "Pronóstico estadístico" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsPage() {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const [period, setPeriod] = useState<DateFilter>(getDefaultDateFilter);
  const [tab, setTab] = useState<TabId>("summary");

  const { properties, current, previous, series, isLoading } = usePortfolioMetrics(period);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const activePropertyId = selectedPropertyId || properties[0]?.id;
  const { data: forecastData, isLoading: isLoadingForecast } = useForecast(activePropertyId, 3);
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();
  const { isDemoMode } = useAuth();

  const handleExportCSV = async () => {
    if (!activePropertyId) {
      toast.info("Sin propiedad", "No hay propiedades disponibles para exportar.");
      return;
    }
    setIsExporting(true);
    try {
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 600));
        const demoCsv = "Fecha,Tipo,Concepto,Monto,Moneda,Canal,Estado\n2026-10-01,Reserva,Guest Demo,450.00,USD,Airbnb,Confirmada\n2026-10-05,Gasto,Mantenimiento,75.00,USD,-,Pagado\n2026-10-12,Reserva,Guest Demo 2,620.00,USD,Directo,Confirmada";
        const blob = new Blob([demoCsv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `nomora_analisis_${activePropertyId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("CSV descargado", "Datos exportados correctamente.");
        return;
      }
      const response = await api.get(`/export/csv?property_id=${activePropertyId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `nomora_analisis_${activePropertyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV descargado", "Datos exportados correctamente.");
    } catch (error: any) {
      toast.error("Error al exportar", error?.response?.data?.detail || "No se pudo exportar el archivo CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = [
    {
      label: "Ingresos totales",
      value: formatCurrencyCompact(current.revenue),
      trend: <TrendBadge value={pctChange(current.revenue, previous.revenue)} />,
      icon: Banknote,
    },
    {
      label: "Ingresos netos",
      value: formatCurrencyCompact(current.netRevenue),
      trend: <TrendBadge value={pctChange(current.netRevenue, previous.netRevenue)} />,
      icon: TrendingUp,
    },
    {
      label: "Tasa de ocupación",
      value: `${current.occupancy}%`,
      trend: <TrendBadge value={pointsChange(current.occupancy, previous.occupancy)} unit=" pts" />,
      icon: PieChart,
    },
    {
      label: "ADR",
      value: formatCurrency(current.adr),
      trend: <TrendBadge value={pctChange(current.adr, previous.adr)} />,
      icon: BedDouble,
    },
    {
      label: "RevPAR",
      value: formatCurrency(current.revpar),
      trend: <TrendBadge value={pctChange(current.revpar, previous.revpar)} />,
      icon: Gauge,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Análisis</h1>
            <p className="mt-1 text-ink-muted">Entiende cómo rinde tu negocio y de dónde vienen tus ingresos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <PeriodSelect value={period} onChange={setPeriod} />
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              isLoading={isExporting}
              className="h-10 text-xs sm:text-sm font-medium shadow-sm border border-line-soft hover:bg-surface/80"
            >
              <Download className="mr-1.5 h-4 w-4 text-violet-500" />
              Descargar CSV
            </Button>
          </div>
        </div>

        <div role="tablist" aria-label="Secciones del análisis" className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 sm:w-fit">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                tab === item.id ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="card-surface-interactive p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">{kpi.label}</p>
                <kpi.icon className="h-4 w-4 text-violet-500" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{isLoading ? "--" : kpi.value}</p>
              <div className="mt-2 min-h-8">{!isLoading && kpi.trend}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <div role="tabpanel" className="space-y-6">
            {tab === "summary" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <RevenueOccupancyChart data={series} />
                  </div>
                  <ChannelDonut channels={current.channels} total={current.revenue} />
                </div>
                <PropertyTable properties={properties} stats={current.byProperty} sortBy="revenue" />
              </>
            )}
            {tab === "revenue" && (
              <>
                <RevenueBarsChart data={series} />
                <PropertyTable properties={properties} stats={current.byProperty} sortBy="revenue" />
              </>
            )}
            {tab === "occupancy" && (
              <>
                <OccupancyLineChart data={series} />
                <PropertyTable properties={properties} stats={current.byProperty} sortBy="occupancy" />
              </>
            )}
            {tab === "channels" && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <ChannelDonut channels={current.channels} total={current.revenue} />
                <ChannelTable channels={current.channels} />
              </div>
            )}
            {tab === "forecast" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink-muted">
                    Pronóstico estadístico de ingresos y beneficio neto a 3 meses utilizando series temporales (Holt-Winters / Holt lineal).
                  </p>
                  {properties.length > 1 && (
                    <select
                      value={activePropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="rounded-xl border border-line-soft bg-card px-3 py-1.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {isLoadingForecast ? (
                  <Skeleton className="h-72 w-full" />
                ) : forecastData && forecastData.forecasts?.length > 0 ? (
                  <>
                    {/* Barra de estado del modelo estadístico y confianza */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line-soft bg-surface/60 p-4 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-ink">
                        <span className="font-semibold text-emerald-400">Modelo:</span>
                        <span className="rounded bg-white/5 px-2 py-0.5 border border-line-soft font-mono">
                          {forecastData.model || "holt"}
                        </span>
                        <span className="text-ink-muted">|</span>
                        <span className="font-semibold text-emerald-400">Nivel de confianza:</span>
                        <span
                          className={`rounded px-2 py-0.5 font-medium ${
                            forecastData.confidence_level === "limited"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : forecastData.confidence_level === "high"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                          }`}
                        >
                          {forecastData.confidence_level === "limited"
                            ? "Limitada (< 4 meses)"
                            : forecastData.confidence_level === "high"
                            ? "Alta (≥ 12 meses)"
                            : "Media (4-11 meses)"}
                        </span>
                        {forecastData.backtest_mape != null && (
                          <>
                            <span className="text-ink-muted">|</span>
                            <span className="text-ink-muted">
                              Error backtest (MAPE): {forecastData.backtest_mape}%
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-ink-muted italic">
                        Entre más datos registres, más preciso será el pronóstico.
                      </p>
                    </div>

                    {/* Aviso cuando la confianza es limitada */}
                    {(forecastData.confidence_level === "limited" ||
                      forecastData.historical_months_count < 4) && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <p className="font-semibold">Confianza limitada en esta propiedad</p>
                        <p className="mt-0.5 text-amber-300/80">
                          Se cuenta con menos de 4 meses de historial. El pronóstico actual se calcula como promedio móvil preventivo.
                        </p>
                      </div>
                    )}

                    <ForecastChart
                      forecasts={forecastData.forecasts}
                      propertyName={forecastData.property_name}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {forecastData.forecasts.map((f) => (
                        <div key={f.month} className="card-surface p-5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                              Mes {f.month}
                            </p>
                            <span className="rounded bg-white/5 border border-line-soft px-1.5 py-0.5 text-[10px] text-ink-muted font-mono">
                              {f.model_used}
                            </span>
                          </div>
                          <p className="mt-2 text-xl font-bold text-ink">
                            {formatCurrency(f.projected_gross_income)}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            Rango: {formatCurrency(f.gross_income_min)} - {formatCurrency(f.gross_income_max)}
                          </p>
                          <div className="mt-3 border-t border-line-soft pt-2">
                            <span className="text-xs text-ink-muted">Beneficio neto estimado: </span>
                            <span className="text-xs font-semibold text-emerald-400">
                              {formatCurrency(f.projected_net_profit)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line-soft bg-surface text-sm text-ink-muted">
                    No hay suficientes datos históricos para generar pronósticos en esta propiedad.
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        <p className="text-xs text-ink-muted">
          Los ingresos se reparten por noche dentro del periodo y solo cuentan reservas confirmadas o
          completadas. ADR es el ingreso promedio por noche reservada y RevPAR el ingreso por noche
          disponible.
        </p>
      </div>
    </DashboardLayout>
  );
}
