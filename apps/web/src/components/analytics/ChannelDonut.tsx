"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getChannel } from "@/lib/channels";
import type { ChannelStat } from "@/lib/metrics";

interface ChannelDonutProps {
  channels: ChannelStat[];
  total: number;
  title?: string;
}

export function ChannelDonut({ channels, total, title = "Ingresos por canal" }: ChannelDonutProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const data = channels.map((c) => ({ ...c, ...getChannel(c.platform) }));

  return (
    <section aria-labelledby="channel-title" className="card-surface flex h-full flex-col p-6">
      <h2 id="channel-title" className="mb-4 text-sm font-medium text-ink-muted">
        {title}
      </h2>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-soft bg-surface p-6 text-center text-sm text-ink-muted">
          Aún no hay ingresos en este periodo.
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="revenue"
                  nameKey="label"
                  innerRadius="64%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.platform} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-line-soft bg-card px-3 py-2 shadow-xl">
                        <p className="text-xs text-ink-muted">{payload[0].name}</p>
                        <p className="text-sm font-semibold text-ink">
                          {formatCurrency(Number(payload[0].value))}
                        </p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-ink-muted">Total</span>
              <span className="text-lg font-bold text-ink">{formatCurrencyCompact(total)}</span>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {data.map((entry) => (
              <li key={entry.platform} className="flex items-center gap-3 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-ink">{entry.label}</span>
                <span className="text-ink-muted">{entry.share}%</span>
                <span className="w-20 text-right font-medium text-ink">
                  {formatCurrencyCompact(entry.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
