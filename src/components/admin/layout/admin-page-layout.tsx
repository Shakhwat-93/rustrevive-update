import React from "react";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageLayout({
  title,
  subtitle,
  badge,
  actions,
  filters,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Filters Bar */}
      {filters && <div className="pt-1 w-full">{filters}</div>}

      {/* Main Module Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
