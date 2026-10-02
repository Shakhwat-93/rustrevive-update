"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Printer, ChevronDown, FileText, Receipt } from "lucide-react";

interface PrintInvoiceMenuProps {
  orderId: string;
}

export function PrintInvoiceMenu({ orderId }: PrintInvoiceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="inline-flex rounded border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors">
        {/* Main button: Links to invoice preview */}
        <Link
          href={`/admin/orders/${orderId}/invoice`}
          className="px-3 py-1.5 text-slate-700 text-xs font-mono flex items-center space-x-1.5"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Invoice</span>
        </Link>

        {/* Dropdown toggle button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-1.5 py-1.5 text-slate-500 hover:text-slate-900 border-l border-slate-200 cursor-pointer"
          aria-haspopup="true"
          aria-expanded={isOpen}
          title="Choose receipt or invoice print format"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Select Print Format
          </div>

          {/* 1. Standard / A4 Invoice */}
          <Link
            href={`/admin/orders/${orderId}/invoice?format=a4`}
            onClick={() => setIsOpen(false)}
            className="flex items-start space-x-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">Standard / A4 Invoice</div>
              <div className="text-[10px] text-slate-500">Official commercial tax invoice</div>
            </div>
          </Link>

          {/* 2. 58mm Thermal Receipt */}
          <Link
            href={`/admin/orders/${orderId}/invoice?format=58mm`}
            onClick={() => setIsOpen(false)}
            className="flex items-start space-x-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">58mm Thermal Receipt</div>
              <div className="text-[10px] text-slate-500">Exact 58mm POS compact format</div>
            </div>
          </Link>

          {/* 3. 80mm Thermal Receipt */}
          <Link
            href={`/admin/orders/${orderId}/invoice?format=80mm`}
            onClick={() => setIsOpen(false)}
            className="flex items-start space-x-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Receipt className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">80mm Thermal Receipt</div>
              <div className="text-[10px] text-slate-500">Exact 80mm POS wide format</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
