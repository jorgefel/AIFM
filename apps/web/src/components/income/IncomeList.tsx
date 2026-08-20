import { DataTable } from "@/components/ui/DataTable";
import { Wallet, Edit2, Trash2 } from "lucide-react";
import { Reservation } from "@/types/models";
import { motion, Variants } from "framer-motion";

interface IncomeListProps {
  reservations: Reservation[];
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  onEdit: (res: Reservation) => void;
  onDelete: (id: string) => void;
  itemVariants: Variants;
}

export function IncomeList({ reservations, isLoading, formatCurrency, onEdit, onDelete, itemVariants }: IncomeListProps) {
  const columns = [
    { header: "Huésped", accessorKey: "guest_name" },
    { 
      header: "Plataforma", 
      accessorKey: "platform",
      cell: (item: Reservation) => <span className="capitalize">{item.platform}</span>
    },
    { 
      header: "Fechas", 
      accessorKey: "dates",
      cell: (item: Reservation) => `${item.check_in} a ${item.check_out}`
    },
    { 
      header: "Neto", 
      accessorKey: "net_amount",
      cell: (item: Reservation) => (
        <span className="font-bold text-teal-600">
          {formatCurrency(Number(item.net_amount))}
        </span>
      )
    },
    { 
      header: "Estado", 
      accessorKey: "status",
      cell: (item: Reservation) => {
        const colors: any = {
          confirmed: "text-teal-700 bg-teal-50 border-teal-200",
          pending: "text-amber-700 bg-amber-50 border-amber-200",
          cancelled: "text-coral-accent bg-coral-accent/10 border-coral-accent/20",
          completed: "text-blue-700 bg-blue-50 border-blue-200"
        };
        const color = colors[item.status] || "text-ink-muted bg-surface border-black/10";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color} capitalize`}>
            {item.status}
          </span>
        );
      }
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Reservation) => (
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
    <motion.div variants={itemVariants}>
      <DataTable 
        data={reservations} 
        columns={columns} 
        isLoading={isLoading} 
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-ink-muted" />
            </div>
            <p className="text-lg font-medium text-ink mb-1">Sin reservas registradas</p>
            <p className="text-sm max-w-sm mx-auto">No hay reservaciones para esta propiedad. Haz clic en "Nueva Reserva" para añadir una.</p>
          </div>
        }
      />
    </motion.div>
  );
}
