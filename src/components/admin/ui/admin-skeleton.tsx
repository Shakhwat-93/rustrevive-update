import React from "react";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3" />
      <div className="h-8 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-50 rounded w-2/3" />
    </div>
  );
}
