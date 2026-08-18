import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon?: LucideIcon;
}

export function KPICard({
  title,
  value,
  change,
  trend = "neutral",
  subtitle,
  icon: Icon,
}: KPICardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </div>

        {(change || subtitle) && (
          <div className="flex items-center space-x-2 text-xs">
            {change && (
              <span
                className={`inline-flex items-center font-medium ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                      ? "text-rose-600"
                      : "text-slate-600"
                }`}
              >
                {trend === "up" && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                {trend === "down" && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
