"use client";

import { useState } from "react";
import { Banknote, BedDouble, Gauge, PieChart, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PeriodSelect } from "@/components/ui/PeriodSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendBadge } from "@/components/dashboard/TrendBadge";
import { ChannelDonut } from "@/components/analytics/ChannelDonut";
import {
  ChannelTable,
  OccupancyLineChart,
  PropertyTable,
  RevenueBarsChart,
  RevenueOccupancyChart,
} from "@/components/analytics/AnalyticsCharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { pctChange, pointsChange, type PeriodId } from "@/lib/metrics";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "revenue", label: "Ingresos" },
  { id: "occupancy", label: "Ocupación" },
  { id: "channels", label: "Canales" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsPage() {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const [period, setPeriod] = useState<PeriodId>("month");
  const [tab, setTab] = useState<TabId>("summary");

  const { properties, current, previous, series, isLoading } = usePortfolioMetrics(period);

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
          <PeriodSelect value={period} onChange={setPeriod} />
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
