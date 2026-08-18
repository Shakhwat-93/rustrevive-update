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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2.5 flex-wrap">{actions}</div>
        )}
      </div>

      {/* Optional Filters Bar */}
      {filters && <div className="pt-1">{filters}</div>}

      {/* Main Module Content */}
      <div>{children}</div>
    </div>
  );
}
