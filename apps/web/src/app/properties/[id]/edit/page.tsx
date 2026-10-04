"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PropertyWizard } from "@/components/properties/wizard/PropertyWizard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProperty } from "@/hooks/useProperty";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const { property, isLoading } = useProperty(params.id);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href={`/properties/${params.id}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la propiedad
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Editar propiedad</h1>
          {property && <p className="mt-1 text-ink-muted">{property.name}</p>}
        </div>

        {isLoading && <Skeleton className="h-96 w-full" />}

        {!isLoading && !property && (
          <div className="card-surface p-8 text-center">
            <p className="font-medium text-ink">No encontramos esta propiedad</p>
            <Link href="/properties" className="mt-2 inline-block text-sm text-violet-600 hover:text-violet-500">
              Ir a mis propiedades
            </Link>
          </div>
        )}

        {property && <PropertyWizard key={property.id} property={property} />}
      </div>
    </DashboardLayout>
  );
}
