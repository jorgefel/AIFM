import React from "react";
import { Loader2 } from "lucide-react";
import { SkeletonTable } from "./Skeleton";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
}

export function DataTable<T>({ data, columns, isLoading, emptyMessage = "No hay datos disponibles." }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-obsidian-light/20 backdrop-blur-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/5">
            {columns.map((col, idx) => (
              <th key={idx} className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <SkeletonTable columns={columns.length} rows={5} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0 group"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="p-4 text-sm text-slate-300">
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
