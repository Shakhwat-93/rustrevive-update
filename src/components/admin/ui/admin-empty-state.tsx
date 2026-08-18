import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { AdminButton } from "@/components/admin/ui/admin-button";

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionHref,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <div className="py-14 px-6 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {actionText && (
        <div className="pt-2">
          {actionHref ? (
            <AdminButton href={actionHref} size="sm">
              {actionText}
            </AdminButton>
          ) : (
            <AdminButton onClick={onAction} size="sm">
              {actionText}
            </AdminButton>
          )}
        </div>
      )}
    </div>
  );
}
