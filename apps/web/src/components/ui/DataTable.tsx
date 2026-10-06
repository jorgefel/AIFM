import React from "react";
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
    <div className="w-full overflow-x-auto rounded-xl border border-line-soft bg-card shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line-soft bg-surface">
            {columns.map((col, idx) => (
              <th key={idx} className="p-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">
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
              <td colSpan={columns.length} className="p-8 text-center text-ink-muted text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="border-b border-line-soft hover:bg-surface transition-colors last:border-b-0 group"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="p-4 text-sm text-ink/85">
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
