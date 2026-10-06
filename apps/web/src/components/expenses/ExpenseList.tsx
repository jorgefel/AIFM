import { DataTable } from "@/components/ui/DataTable";
import { ReceiptText, FileText, Edit2, Trash2 } from "lucide-react";
import { Expense } from "@/types/models";
import { motion, Variants } from "framer-motion";

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
  itemVariants: Variants;
}

export function ExpenseList({ expenses, isLoading, formatCurrency, onEdit, onDelete, itemVariants }: ExpenseListProps) {
  const columns = [
    { header: "Descripción", accessorKey: "description" },
    { 
      header: "Categoría", 
      accessorKey: "category",
      cell: (item: Expense) => <span className="capitalize">{item.category}</span>
    },
    { header: "Fecha", accessorKey: "date" },
    { 
      header: "Monto", 
      accessorKey: "amount",
      cell: (item: Expense) => (
        <span className="font-bold text-coral-accent">
          -{formatCurrency(Number(item.amount))}
        </span>
      )
    },
    {
      header: "Recibo",
      accessorKey: "receipt_url",
      cell: (item: Expense) => (
        item.receipt_url ? (
          <a 
            href={`/api${item.receipt_url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 transition-colors"
          >
            <FileText className="w-4 h-4" /> Ver
          </a>
        ) : (
          <span className="text-xs text-ink-muted">Sin recibo</span>
        )
      )
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (item: Expense) => (
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
        data={expenses} 
        columns={columns} 
        isLoading={isLoading} 
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <ReceiptText className="w-8 h-8 text-ink-muted" />
            </div>
            <p className="text-lg font-medium text-ink mb-1">Sin gastos registrados</p>
            <p className="text-sm max-w-sm mx-auto">No hay gastos para esta propiedad. Haz clic en "Nuevo Gasto" para registrar uno.</p>
          </div>
        }
      />
    </motion.div>
  );
}
