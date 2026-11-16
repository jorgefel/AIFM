"use client";

import { getChannel } from "@/lib/channels";
import type { ChannelStat } from "@/lib/metrics";

interface ChannelBarsProps {
  channels: ChannelStat[];
  title?: string;
}

export function ChannelBars({ channels, title = "Ingresos por canal" }: ChannelBarsProps) {
  return (
    <section aria-labelledby="channel-bars-title" className="card-surface h-full p-6">
      <h2 id="channel-bars-title" className="mb-5 text-sm font-semibold text-ink">
        {title}
      </h2>

      {channels.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-soft p-6 text-center text-sm text-ink-muted">
          Aún no hay ingresos en este periodo.
        </p>
      ) : (
        <ul className="space-y-4">
          {channels.map((channel) => {
            const info = getChannel(channel.platform);
            return (
              <li key={channel.platform} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="truncate text-ink">{info.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(channel.share, 2)}%`, backgroundColor: info.color }}
                  />
                </div>
                <span className="text-right text-ink-muted">{channel.share}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
