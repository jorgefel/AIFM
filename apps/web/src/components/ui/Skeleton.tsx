import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-ink/[0.05] ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-surface p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card-surface p-6 space-y-4 h-[400px] flex flex-col">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex-1 flex items-end gap-2 pt-4">
        {[40, 65, 45, 80, 55, 70].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="card-surface p-6 h-[400px] flex flex-col space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ columns = 4, rows = 5 }: { columns?: number, rows?: number }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-line-soft bg-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line-soft bg-surface">
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="p-4">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-line-soft last:border-b-0">
              {[...Array(columns)].map((_, colIdx) => (
                <td key={colIdx} className="p-4">
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
