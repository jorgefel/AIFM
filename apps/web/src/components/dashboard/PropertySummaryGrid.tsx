"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { resolvePhotoUrl } from "@/lib/resolvePhotoUrl";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { PropertyStat } from "@/lib/metrics";
import type { Property } from "@/types/models";

interface PropertySummaryGridProps {
  properties: Property[];
  stats: PropertyStat[];
}

export function PropertySummaryGrid({ properties, stats }: PropertySummaryGridProps) {
  const { formatCurrencyCompact } = useCurrency();

  return (
    <section aria-labelledby="properties-summary-title" className="card-surface h-full p-6">
      <header className="mb-5 flex items-center justify-between">
        <h2 id="properties-summary-title" className="text-sm font-medium text-ink-muted">
          Resumen de propiedades
        </h2>
        <Link
          href="/properties"
          className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-violet-50 hover:text-violet-600"
        >
          Ver todas
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      {properties.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">No hay propiedades registradas.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {properties.map((property) => {
            const stat = stats.find((s) => s.propertyId === property.id);
            const cover = property.photo_urls?.[0];
            return (
              <li key={property.id}>
                <Link
                  href={`/properties/${property.id}`}
                  className="group block overflow-hidden rounded-2xl border border-line-soft bg-card transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-violet-100 to-cyan-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolvePhotoUrl(cover)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-violet-600/60">
                        <Building2 className="h-9 w-9" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="truncate font-semibold text-ink group-hover:text-violet-600">
                        {property.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {property.address || "Sin dirección"}
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
                      <div>
                        <dt className="text-xs text-ink-muted">Ingresos</dt>
                        <dd className="text-sm font-semibold text-ink">
                          {formatCurrencyCompact(stat?.revenue ?? 0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-muted">Ocupación</dt>
                        <dd className="text-sm font-semibold text-ink">{stat?.occupancy ?? 0}%</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
