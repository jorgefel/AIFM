"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarketComparisonTable } from "@/components/properties/MarketComparisonTable";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMarketComparison } from "@/hooks/useMarketComparison";
import { useProperty } from "@/hooks/useProperty";

export default function PropertyComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const { property, isLoading: loadingProperty } = useProperty(id);
  const { data: comparison, isLoading, error, refresh } = useMarketComparison(id);
  const busy = refresh.isPending || comparison?.status === "PENDING" || comparison?.status === "PROCESSING";
  return <DashboardLayout><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><Link href={`/properties/${id}`} className="text-sm text-ink-muted hover:text-ink">← Volver a la propiedad</Link><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Comparación</h1><p className="mt-1 text-sm text-ink-muted">Tu propiedad frente a alojamientos públicos de Airbnb en la zona.</p></div><Button onClick={() => refresh.mutate()} disabled={busy || !property}><RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />{busy ? "Actualizando…" : "Actualizar"}</Button></div>
    {loadingProperty || isLoading ? <Skeleton className="h-72 w-full" /> : !property ? <p className="card-surface p-6 text-ink-muted">No encontramos la propiedad.</p> : error || comparison?.status === "FAILED" ? <div role="alert" className="card-surface p-6 text-rose-700">No pudimos cargar la comparación. Intenta actualizar nuevamente.</div> : comparison?.status !== "READY" ? <div role="status" className="card-surface p-6"><p className="font-medium text-ink">Aún no hay una comparación disponible.</p><p className="mt-1 text-sm text-ink-muted">Solicita una actualización para consultar los alojamientos de la zona.</p></div> : <><div className="card-surface p-4 text-sm text-ink-muted">{comparison.aggregates?.listing_count ?? 0} alojamientos encontrados · Datos públicos obtenidos el {comparison.fetched_at ? new Date(comparison.fetched_at).toLocaleString() : "—"}. Las reseñas públicas no equivalen a reservas u ocupación.</div><MarketComparisonTable property={property} comparison={comparison} /></>}
  </div></DashboardLayout>;
}
