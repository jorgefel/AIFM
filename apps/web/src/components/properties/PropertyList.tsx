"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Edit2, Trash2, Building2 } from "lucide-react";
import { Property } from "@/types/models";

interface PropertyListProps {
  properties: Property[];
  isLoading: boolean;
  onEdit: (prop: Property) => void;
  onDelete: (id: string) => void;
}

export function PropertyList({ properties, isLoading, onEdit, onDelete }: PropertyListProps) {
  const columns = [
    { header: "Nombre", accessorKey: "name" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Moneda", accessorKey: "currency" },
    {
      header: "Fecha de Creación",
      accessorKey: "created_at",
      cell: (item: Property) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Property) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(item)}
            className="p-1.5 text-ink-muted hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-ink-muted hover:text-coral-accent hover:bg-coral-accent/10 rounded-md transition-colors"
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
          <p className="text-sm max-w-sm mx-auto">No tienes propiedades registradas aún. Haz clic en "Nueva Propiedad" para comenzar.</p>
        </div>
      }
    />
  );
}
