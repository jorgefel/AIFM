"use client";

import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { Edit2, Trash2, Building2, Eye, Users } from "lucide-react";
import { formatNightlyPrice, getPropertyTypeLabel } from "@/lib/propertyOptions";
import { Property } from "@/types/models";

interface PropertyListProps {
  properties: Property[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const actionClass =
  "p-1.5 text-ink-muted rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-violet-500";

export function PropertyList({ properties, isLoading, onDelete }: PropertyListProps) {
  const columns = [
    {
      header: "Propiedad",
      accessorKey: "name",
      cell: (item: Property) => {
        const cover = item.photo_urls?.[0];
        return (
          <Link href={`/properties/${item.id}`} className="flex items-center gap-3 group">
            <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5 text-ink-muted" />
              )}
            </span>
            <span className="font-medium text-ink group-hover:text-violet-600">{item.name}</span>
          </Link>
        );
      },
    },
    {
      header: "Tipo",
      accessorKey: "property_type",
      cell: (item: Property) => getPropertyTypeLabel(item.property_type),
    },
    { header: "Dirección", accessorKey: "address" },
    {
      header: "Capacidad",
      accessorKey: "max_guests",
      cell: (item: Property) => (
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {item.max_guests}
        </span>
      ),
    },
    {
      header: "Por noche",
      accessorKey: "nightly_rate",
      cell: (item: Property) => formatNightlyPrice(item.nightly_rate, item.currency) ?? "Sin definir",
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Property) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${item.id}`}
            aria-label={`Ver ${item.name}`}
            className={`${actionClass} hover:text-violet-600 hover:bg-violet-50`}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/properties/${item.id}/edit`}
            aria-label={`Editar ${item.name}`}
            className={`${actionClass} hover:text-violet-600 hover:bg-violet-50`}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            aria-label={`Eliminar ${item.name}`}
            className={`${actionClass} hover:text-coral-accent hover:bg-coral-accent/10`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={properties}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={
        <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-ink-muted" />
          </div>
          <p className="text-lg font-medium text-ink mb-1">Sin propiedades</p>
          <p className="text-sm max-w-sm mx-auto">No tienes propiedades registradas aún. Haz clic en &quot;Nueva Propiedad&quot; para comenzar.</p>
        </div>
      }
    />
  );
}
