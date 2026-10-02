"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  FileText,
  Receipt,
  Check,
  Info,
} from "lucide-react";
import type { InvoiceData, InvoiceFormat } from "@/types/invoice.types";
import { StandardInvoice } from "./StandardInvoice";
import { ThermalReceipt58 } from "./ThermalReceipt58";
import { ThermalReceipt80 } from "./ThermalReceipt80";

interface InvoiceViewerProps {
  data: InvoiceData;
  initialFormat?: InvoiceFormat;
}

export function InvoiceViewer({
  data,
  initialFormat = "a4",
}: InvoiceViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read format from URL query param if present
  const formatParam = searchParams.get("format") as InvoiceFormat | null;
  const validFormats: InvoiceFormat[] = ["a4", "58mm", "80mm"];
  const initial =
    formatParam && validFormats.includes(formatParam)
      ? formatParam
      : initialFormat;

  const [activeFormat, setActiveFormat] = useState<InvoiceFormat>(initial);

  // Auto-print support if requested via URL (?autoprint=true)
  useEffect(() => {
    if (searchParams.get("autoprint") !== "true") return;

    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Handle format switch and reflect in URL without reload
  const handleFormatChange = (newFormat: InvoiceFormat) => {
    setActiveFormat(newFormat);
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", newFormat);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 print:bg-white print:py-0 print:min-h-0">
      {/* Dynamic @page and Print CSS Isolation */}
      {activeFormat === "58mm" && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: 58mm auto;
              margin: 0;
            }
            @media print {
              html, body {
                width: 58mm !important;
                min-width: 58mm !important;
                max-width: 58mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print\\:hidden,
              .no-print,
              header,
              nav,
              aside,
              footer,
              .admin-header,
              .admin-sidebar {
                display: none !important;
              }
              .thermal-receipt-58 {
                width: 58mm !important;
                min-width: 58mm !important;
                max-width: 58mm !important;
                margin: 0 !important;
                padding: 2mm 2.5mm !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `,
        }} />
      )}

      {activeFormat === "80mm" && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html, body {
                width: 80mm !important;
                min-width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print\\:hidden,
              .no-print,
              header,
              nav,
              aside,
              footer,
              .admin-header,
              .admin-sidebar {
                display: none !important;
              }
              .thermal-receipt-80 {
                width: 80mm !important;
                min-width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 3mm 4mm !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `,
        }} />
      )}

      {activeFormat === "a4" && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print\\:hidden,
              .no-print,
              header,
              nav,
              aside,
              footer,
              .admin-header,
              .admin-sidebar {
                display: none !important;
              }
              .invoice-standard {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
            }
          `,
        }} />
      )}

      {/* Screen-Only Control Toolbar */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          {/* Back link & Title */}
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/orders/${data.orderId}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-mono rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Order</span>
            </Link>
            <div>
              <span className="text-xs font-mono text-slate-400">Order:</span>{" "}
              <span className="text-xs font-mono font-bold text-slate-900">
                {data.orderNumber}
              </span>
            </div>
          </div>

          {/* Format Selector Tabs */}
          <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => handleFormatChange("a4")}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${
                activeFormat === "a4"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => handleFormatChange("58mm")}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${
                activeFormat === "58mm"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>58mm Thermal</span>
            </button>

            <button
              type="button"
              onClick={() => handleFormatChange("80mm")}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${
                activeFormat === "80mm"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm Thermal</span>
            </button>
          </div>

          {/* Print Trigger Button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-xs font-mono font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                Print{" "}
                {activeFormat === "a4"
                  ? "A4"
                  : activeFormat === "58mm"
                  ? "58mm"
                  : "80mm"}
              </span>
            </button>
          </div>
        </div>

        {/* Format Info Banner */}
        <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {activeFormat === "a4" &&
                "Standard Commercial Tax Invoice • Formatted for standard desktop/office A4 printers."}
              {activeFormat === "58mm" &&
                "Physical 58mm Thermal Receipt (Exact) • Dynamic Height • Safe printable area: ~48-52mm."}
              {activeFormat === "80mm" &&
                "Physical 80mm Thermal Receipt (Exact) • Dynamic Height • Safe printable area: ~70-74mm."}
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center text-emerald-700 font-medium">
            <Check className="w-3 h-3 mr-1" /> Ready to Print
          </span>
        </div>
      </div>

      {/* Screen Preview Container */}
      <div className="max-w-4xl mx-auto px-4 print:p-0 print:m-0 print:max-w-none">
        {activeFormat === "a4" && <StandardInvoice data={data} />}

        {activeFormat === "58mm" && (
          <div className="flex justify-center py-4 print:p-0 print:m-0 print:block">
            <div className="shadow-lg border border-slate-300 rounded-xs print:shadow-none print:border-none">
              <ThermalReceipt58 data={data} />
            </div>
          </div>
        )}

        {activeFormat === "80mm" && (
          <div className="flex justify-center py-4 print:p-0 print:m-0 print:block">
            <div className="shadow-lg border border-slate-300 rounded-xs print:shadow-none print:border-none">
              <ThermalReceipt80 data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
