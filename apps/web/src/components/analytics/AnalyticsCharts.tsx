"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useChartTheme } from "@/hooks/useChartTheme";
import { getChannel } from "@/lib/channels";
import type { ChannelStat, MonthPoint, PropertyStat } from "@/lib/metrics";
import type { Property } from "@/types/models";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface flex h-full flex-col p-6">
      <h2 className="mb-4 text-sm font-medium text-ink-muted">{title}</h2>
      <div className="h-72">{children}</div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  format: (name: string | undefined, value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-soft bg-card px-4 py-3 shadow-xl">
      <p className="mb-1.5 text-xs font-medium text-ink-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-ink-muted">{entry.name}:</span>
          <span className="font-semibold text-ink">{format(entry.name, Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueOccupancyChart({ data }: { data: MonthPoint[] }) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const theme = useChartTheme();

  return (
    <ChartCard title="Ingresos y ocupación">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="revenue"
            stroke={theme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrencyCompact(v)}
          />
          <YAxis
            yAxisId="occupancy"
            orientation="right"
            domain={[0, 100]}
            stroke={theme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={
              <ChartTooltip
                format={(name, value) => (name === "Ocupación" ? `${value}%` : formatCurrency(value))}
              />
            }
          />
          <Bar yAxisId="revenue" dataKey="revenue" name="Ingresos" fill="#A855F7" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Line
            yAxisId="occupancy"
            type="monotone"
            dataKey="occupancy"
            name="Ocupación"
            stroke="#14B8A6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#14B8A6", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueBarsChart({ data }: { data: MonthPoint[] }) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const theme = useChartTheme();

  return (
    <ChartCard title="Ingresos por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke={theme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrencyCompact(v)}
          />
          <Tooltip content={<ChartTooltip format={(_n, value) => formatCurrency(value)} />} />
          <Bar dataKey="revenue" name="Ingresos" fill="#A855F7" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OccupancyLineChart({ data }: { data: MonthPoint[] }) {
  const theme = useChartTheme();

  return (
    <ChartCard title="Ocupación por mes">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 100]}
            stroke={theme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip format={(_n, value) => `${value}%`} />} />
          <Line
            type="monotone"
            dataKey="occupancy"
            name="Ocupación"
            stroke="#14B8A6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#14B8A6", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PropertyTableProps {
  properties: Property[];
  stats: PropertyStat[];
  sortBy: "revenue" | "occupancy";
}

export function PropertyTable({ properties, stats, sortBy }: PropertyTableProps) {
  const { formatCurrency } = useCurrency();
  const rows = stats
    .map((stat) => ({ stat, name: properties.find((p) => p.id === stat.propertyId)?.name ?? "Propiedad" }))
    .sort((a, b) => b.stat[sortBy] - a.stat[sortBy]);

  return (
    <section className="card-surface overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left">
        <caption className="px-6 pb-2 pt-5 text-left text-sm font-medium text-ink-muted">
          Rendimiento por propiedad
        </caption>
        <thead>
          <tr className="border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <th scope="col" className="px-6 py-3">Propiedad</th>
            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
            <th scope="col" className="px-6 py-3 text-right">Noches</th>
            <th scope="col" className="px-6 py-3 text-right">Ocupación</th>
            <th scope="col" className="px-6 py-3 text-right">ADR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map(({ stat, name }) => (
            <tr key={stat.propertyId}>
              <th scope="row" className="px-6 py-3.5 text-sm font-medium text-ink">{name}</th>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{formatCurrency(stat.revenue)}</td>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{stat.bookedNights}</td>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{stat.occupancy}%</td>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{formatCurrency(stat.adr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ChannelTable({ channels }: { channels: ChannelStat[] }) {
  const { formatCurrency } = useCurrency();

  return (
    <section className="card-surface overflow-x-auto">
      <table className="w-full min-w-[22rem] text-left">
        <caption className="px-6 pb-2 pt-5 text-left text-sm font-medium text-ink-muted">
          Detalle por canal
        </caption>
        <thead>
          <tr className="border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <th scope="col" className="px-6 py-3">Canal</th>
            <th scope="col" className="px-6 py-3 text-right">Ingresos</th>
            <th scope="col" className="px-6 py-3 text-right">Participación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {channels.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-6 text-center text-sm text-ink-muted">
                Aún no hay ingresos en este periodo.
              </td>
            </tr>
          )}
          {channels.map((channel) => (
            <tr key={channel.platform}>
              <th scope="row" className="px-6 py-3.5 text-sm font-medium text-ink">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getChannel(channel.platform).color }} />
                {getChannel(channel.platform).label}
              </th>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{formatCurrency(channel.revenue)}</td>
              <td className="px-6 py-3.5 text-right text-sm text-ink">{channel.share}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ForecastChart({
  forecasts,
  propertyName,
}: {
  forecasts: { month: string; projected_gross_income: number; gross_income_min: number; gross_income_max: number; projected_net_profit: number; net_profit_min: number; net_profit_max: number; model_used: string }[];
  propertyName: string;
}) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const theme = useChartTheme();

  const data = forecasts.map((f) => {
    const parts = f.month.split("-");
    const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const label = monthNames[parseInt(parts[1], 10) - 1] ?? f.month;
    return {
      label: `${label} ${parts[0]}`,
      gross: f.projected_gross_income,
      grossMin: f.gross_income_min,
      grossMax: f.gross_income_max,
      net: f.projected_net_profit,
      netMin: f.net_profit_min,
      netMax: f.net_profit_max,
      model: f.model_used,
    };
  });

  return (
    <ChartCard title={`Pronóstico estadístico — ${propertyName}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" stroke={theme.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke={theme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrencyCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(165, 140, 244, 0.08)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0]?.payload;
              if (!item) return null;
              return (
                <div className="rounded-xl border border-line-soft bg-card px-4 py-3 shadow-xl space-y-1.5">
                  <p className="text-xs font-semibold text-ink-muted">{label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <span className="inline-block h-2 w-2 rounded-sm bg-[#433075]" />
                        Ingreso bruto:
                      </span>
                      <strong className="text-ink">{formatCurrency(item.gross)}</strong>
                    </div>
                    {item.grossMin !== undefined && item.grossMax !== undefined && (
                      <p className="text-[10px] text-ink-muted pl-3.5">
                        Banda: {formatCurrencyCompact(item.grossMin)} – {formatCurrencyCompact(item.grossMax)}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-4 text-xs pt-1 border-t border-line-soft">
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <span className="inline-block h-2 w-2 rounded-sm bg-[#A58CF4]" />
                        Beneficio neto:
                      </span>
                      <strong className="text-[#A58CF4]">{formatCurrency(item.net)}</strong>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="gross" name="Ingreso bruto estimado" fill="#433075" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="net" name="Beneficio neto estimado" fill="#A58CF4" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

