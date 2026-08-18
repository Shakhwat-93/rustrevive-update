import React from "react";

export type StatusVariant =
  | "active"
  | "published"
  | "draft"
  | "archived"
  | "paid"
  | "pending"
  | "failed"
  | "fulfilled"
  | "unfulfilled"
  | "low_stock"
  | "out_of_stock";

interface StatusBadgeProps {
  status: string | StatusVariant;
  label?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");

  const badgeConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    published: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    paid: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    fulfilled: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    draft: { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
    archived: { bg: "bg-slate-100 text-slate-600 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
    pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    unfulfilled: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    low_stock: { bg: "bg-orange-50 text-orange-700 border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
    out_of_stock: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
    failed: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  };

  const current = badgeConfig[normalized] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
  };

  const displayLabel = label || status.toUpperCase().replace(/_/g, " ");

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${sizeClass} ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${current.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
