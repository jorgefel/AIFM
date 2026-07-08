import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-6 space-y-4">
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
    <div className="glass-panel p-6 space-y-4 h-[400px] flex flex-col">
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
    <div className="glass-panel p-6 h-[400px] flex flex-col space-y-4">
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
