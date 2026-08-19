"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";

export function PrintButton() {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => window.history.back()}
        className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-mono rounded hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>
      <button
        onClick={() => window.print()}
        className="px-4 py-1.5 bg-slate-900 text-white text-xs font-mono rounded hover:bg-slate-800 flex items-center space-x-1.5 transition-colors font-semibold"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print Invoice</span>
      </button>
    </div>
  );
}
