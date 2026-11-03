"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProperties } from "@/hooks/useProperties";

export default function ComparisonPage() {
  const { properties, isLoading } = useProperties();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Comparación</h1>
          <p className="mt-1 text-ink-muted">Elige una propiedad para compararla con alojamientos de Airbnb en su zona.</p>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando propiedades">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-28 w-full" />)}
          </div>
        ) : properties.length === 0 ? (
          <div role="status" className="card-surface p-6 text-center">
            <p className="font-medium text-ink">Primero agrega una propiedad</p>
            <Link href="/properties/new" className="mt-2 inline-block text-sm font-medium text-violet-600 hover:text-violet-500">Crear propiedad</Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <li key={property.id}>
                <Link href={`/properties/${property.id}/comparison`} className="card-surface flex min-h-28 items-center gap-4 p-5 transition-colors hover:border-violet-400 hover:bg-surface" aria-label={`Comparar ${property.name}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600"><GitCompareArrows className="h-5 w-5" /></span>
                  <span className="min-w-0"><span className="block truncate font-semibold text-ink">{property.name}</span><span className="mt-1 block truncate text-sm text-ink-muted">{property.address}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
