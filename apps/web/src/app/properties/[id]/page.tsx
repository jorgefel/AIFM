"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bath, DoorOpen, MapPin, Pencil, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { getAmenityIcon } from "@/components/properties/amenityIcons";
import { useProperty } from "@/hooks/useProperty";
import {
  formatNightlyPrice,
  getAmenityLabel,
  getChannelLabel,
  getPropertyTypeLabel,
} from "@/lib/propertyOptions";

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-xs text-ink-muted">{label}</dt>
        <dd className="text-sm font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { property, isLoading } = useProperty(params.id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="aspect-[16/9] lg:col-span-2" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="card-surface mx-auto max-w-md p-8 text-center">
          <p className="text-lg font-medium text-ink">No encontramos esta propiedad</p>
          <p className="mt-1 text-sm text-ink-muted">Puede que se haya eliminado o que no tengas acceso.</p>
          <Link href="/properties" className="mt-4 inline-block text-sm font-medium text-violet-600 hover:text-violet-500">
            Volver a mis propiedades
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const photos = property.photo_urls ?? [];
  const price = formatNightlyPrice(property.nightly_rate, property.currency);
  const amenities = property.amenities ?? [];
  const channels = property.published_platforms ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/properties"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Propiedades
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink">{property.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-ink-muted">
                <MapPin className="h-4 w-4" />
                {property.address}
                <span className="ml-2 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                  {getPropertyTypeLabel(property.property_type)}
                </span>
              </p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => router.push(`/properties/${property.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar propiedad
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PropertyGallery photos={photos} name={property.name} />

            <section className="card-surface p-6">
              <h2 className="mb-3 text-lg font-semibold text-ink">Descripción</h2>
              {property.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {property.description}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">Aún no hay una descripción.</p>
              )}
            </section>

            <section className="card-surface p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Amenidades</h2>
              {amenities.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenities.map((id) => {
                    const Icon = getAmenityIcon(id);
                    return (
                      <li key={id} className="flex items-center gap-3 text-sm text-ink">
                        <Icon className="h-4 w-4 text-violet-500" />
                        {getAmenityLabel(id)}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No se han indicado amenidades.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card-surface p-6">
              <p className="text-sm text-ink-muted">Precio base</p>
              <p className="mt-1 text-3xl font-bold text-ink">
                {price ?? "Sin definir"}
                {price && <span className="text-base font-normal text-ink-muted"> / noche</span>}
              </p>
              <p className="mt-1 text-xs text-ink-muted">Moneda: {property.currency}</p>

              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line-soft pt-6">
                <Fact icon={Users} label="Huéspedes" value={property.max_guests} />
                <Fact icon={DoorOpen} label="Habitaciones" value={property.bedrooms} />
                <Fact icon={Bath} label="Baños" value={property.bathrooms} />
              </dl>
            </section>

            <section className="card-surface p-6">
              <h2 className="mb-3 text-lg font-semibold text-ink">Canales</h2>
              {channels.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {channels.map((id) => (
                    <li
                      key={id}
                      className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                    >
                      {getChannelLabel(id)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No se han declarado canales de publicación.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
