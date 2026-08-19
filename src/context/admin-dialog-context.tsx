"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

interface AdminDialogContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  exportToCSV: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

const AdminDialogContext = createContext<AdminDialogContextValue | null>(null);

export function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  // Show Toast
  const showToast = useCallback((message: string, type: ToastType = "success", duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm Modal Promise
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = (result: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(result);
      setConfirmDialog(null);
    }
  };

  // CSV Export Utility
  const exportToCSV = useCallback(
    (filename: string, headers: string[], rows: (string | number)[][]) => {
      try {
        const escapeCSV = (val: string | number) => {
          const str = String(val ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const csvContent = [
          headers.map(escapeCSV).join(","),
          ...rows.map((row) => row.map(escapeCSV).join(",")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename.replace(/\.csv$/, "")}_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Exported ${rows.length} records to ${filename}.csv`, "success");
      } catch (err) {
        console.error("Export failed:", err);
        showToast("Failed to generate CSV export file", "error");
      }
    },
    [showToast]
  );

  return (
    <AdminDialogContext.Provider value={{ showToast, confirm, exportToCSV }}>
      {children}

      {/* Floating Luxury Toasts Container */}
      <div className="fixed top-4 sm:top-auto sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-xl shadow-xl border flex items-start space-x-3 text-xs backdrop-blur-md animate-in slide-in-from-top-3 sm:slide-in-from-bottom-3 duration-200 transition-all ${
                isSuccess
                  ? "bg-slate-900/95 text-white border-slate-800"
                  : isError
                  ? "bg-rose-900/95 text-white border-rose-800"
                  : isWarning
                  ? "bg-amber-900/95 text-white border-amber-800"
                  : "bg-slate-900/95 text-white border-slate-800"
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}

              <div className="flex-1 font-medium leading-relaxed">{t.message}</div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Premium Confirm Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmDialog.options.variant === "danger"
                    ? "bg-rose-50 text-rose-600"
                    : confirmDialog.options.variant === "warning"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-[#9e472a]/10 text-[#9e472a]"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="space-y-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base">
                  {confirmDialog.options.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {confirmDialog.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleConfirmAction(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {confirmDialog.options.cancelText || "Cancel"}
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => handleConfirmAction(true)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors cursor-pointer shadow-xs ${
                  confirmDialog.options.variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmDialog.options.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {confirmDialog.options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDialogContext.Provider>
  );
}

export function useAdminDialog() {
  const context = useContext(AdminDialogContext);
  if (!context) {
    throw new Error("useAdminDialog must be used within an AdminDialogProvider");
  }
  return context;
}
