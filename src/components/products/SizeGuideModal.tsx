"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Ruler,
  Info,
  Maximize2,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";
import type { SizeChartData } from "@/components/admin/products/SizeChartEditor";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  sizeChart?: SizeChartData | null;
  selectedSize?: string | null;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  productTitle,
  sizeChart,
  selectedSize,
}: SizeGuideModalProps) {
  const [activeUnit, setActiveUnit] = useState<"in" | "cm">("in");
  const [activeTab, setActiveTab] = useState<"table" | "image" | "measure">(
    sizeChart?.mode === "image" && !sizeChart.rows?.length ? "image" : "table"
  );
  const [zoomImage, setZoomImage] = useState(false);

  if (!isOpen) return null;

  // Conversion helper (if base chart unit differs)
  const convertValue = (valStr: string | undefined): string => {
    if (!valStr) return "-";
    const num = parseFloat(valStr);
    if (isNaN(num)) return valStr;

    const baseUnit = sizeChart?.unit || "in";
    if (baseUnit === activeUnit) return valStr;

    if (baseUnit === "in" && activeUnit === "cm") {
      return (num * 2.54).toFixed(1);
    }
    if (baseUnit === "cm" && activeUnit === "in") {
      return (num / 2.54).toFixed(1);
    }
    return valStr;
  };

  const rows = sizeChart?.rows || [];
  const imageUrl = sizeChart?.imageUrl;
  const hasTable = rows.length > 0;
  const hasImage = Boolean(imageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141312]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[#fcfaf7] border border-[#ded7c8] text-[#141312] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ded7c8] bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#9e472a]/10 flex items-center justify-center text-[#9e472a]">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif uppercase tracking-wider text-[#141312]">
                Garment Size Guide
              </h3>
              <p className="text-[11px] text-[#78716c] font-mono-meta truncate max-w-xs sm:max-w-md">
                {productTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#78716c] hover:text-[#141312] hover:bg-[#f5f1e8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Unit Controls */}
        <div className="px-6 py-3 bg-[#f8f5ee] border-b border-[#ded7c8] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex rounded-lg bg-[#ede7dc] p-0.5 text-xs font-mono-meta">
            {hasTable && (
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-3 py-1 rounded-md transition-all uppercase tracking-wider ${
                  activeTab === "table"
                    ? "bg-white text-[#141312] font-bold shadow-2xs"
                    : "text-[#78716c] hover:text-[#141312]"
                }`}
              >
                <TableIcon className="w-3 h-3 inline mr-1" />
                Size Table
              </button>
            )}

            {hasImage && (
              <button
                type="button"
                onClick={() => setActiveTab("image")}
                className={`px-3 py-1 rounded-md transition-all uppercase tracking-wider ${
                  activeTab === "image"
                    ? "bg-white text-[#141312] font-bold shadow-2xs"
                    : "text-[#78716c] hover:text-[#141312]"
                }`}
              >
                <ImageIcon className="w-3 h-3 inline mr-1" />
                Chart Image
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("measure")}
              className={`px-3 py-1 rounded-md transition-all uppercase tracking-wider ${
                activeTab === "measure"
                  ? "bg-white text-[#141312] font-bold shadow-2xs"
                  : "text-[#78716c] hover:text-[#141312]"
              }`}
            >
              <Info className="w-3 h-3 inline mr-1" />
              How to Measure
            </button>
          </div>

          {/* Units Switcher */}
          {activeTab === "table" && hasTable && (
            <div className="flex items-center space-x-1.5 text-xs font-mono-meta">
              <span className="text-[#78716c] uppercase text-[10px]">Unit:</span>
              <div className="inline-flex rounded-md border border-[#ded7c8] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveUnit("in")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    activeUnit === "in"
                      ? "bg-[#141312] text-[#fbf9f5]"
                      : "text-[#78716c] hover:text-[#141312]"
                  }`}
                >
                  IN (Inches)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUnit("cm")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    activeUnit === "cm"
                      ? "bg-[#141312] text-[#fbf9f5]"
                      : "text-[#78716c] hover:text-[#141312]"
                  }`}
                >
                  CM (Centimeters)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SIZE TABLE */}
          {activeTab === "table" && (
            <div className="space-y-4">
              {hasTable ? (
                <div className="border border-[#ded7c8] rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5f1e8] border-b border-[#ded7c8] text-[#5c574e] font-mono-meta font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Size</th>
                          <th className="py-3 px-4">Chest ({activeUnit})</th>
                          <th className="py-3 px-4">Length ({activeUnit})</th>
                          <th className="py-3 px-4">Shoulder ({activeUnit})</th>
                          <th className="py-3 px-4">Sleeve ({activeUnit})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ede7dc] font-mono-meta">
                        {rows.map((row) => {
                          const isMatch =
                            selectedSize &&
                            row.size.toLowerCase() === selectedSize.toLowerCase();
                          return (
                            <tr
                              key={row.id || row.size}
                              className={`transition-colors ${
                                isMatch
                                  ? "bg-[#9e472a]/10 font-bold text-[#9e472a]"
                                  : "hover:bg-[#fbf9f5] text-[#141312]"
                              }`}
                            >
                              <td className="py-3 px-4 font-bold flex items-center space-x-1.5">
                                <span>{row.size}</span>
                                {isMatch && (
                                  <span className="text-[10px] bg-[#9e472a] text-white px-1.5 py-0.5 rounded font-sans uppercase">
                                    Selected
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">{convertValue(row.chest)}</td>
                              <td className="py-3 px-4">{convertValue(row.length)}</td>
                              <td className="py-3 px-4">{convertValue(row.shoulder)}</td>
                              <td className="py-3 px-4">{convertValue(row.sleeve)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#78716c] text-center py-8">
                  No size table measurements available.
                </p>
              )}

              {/* Sizing Note */}
              {sizeChart?.note && (
                <div className="p-3.5 bg-[#f5f1e8] rounded-xl border border-[#ded7c8] flex items-start space-x-2 text-xs text-[#5c574e]">
                  <Info className="w-4 h-4 text-[#9e472a] shrink-0 mt-0.5" />
                  <p>{sizeChart.note}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHART IMAGE */}
          {activeTab === "image" && imageUrl && (
            <div className="space-y-3">
              <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-[#ded7c8] bg-white">
                <Image
                  src={getMediaUrl(imageUrl)}
                  alt={`${productTitle} Size Chart`}
                  fill
                  className="object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => setZoomImage(true)}
                  className="absolute bottom-3 right-3 p-2 bg-white/90 hover:bg-white text-[#141312] rounded-lg shadow-md border border-[#ded7c8] text-xs font-mono-meta flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand</span>
                </button>
              </div>

              {sizeChart?.note && (
                <div className="p-3 bg-[#f5f1e8] rounded-xl border border-[#ded7c8] text-xs text-[#5c574e]">
                  <p>{sizeChart.note}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOW TO MEASURE */}
          {activeTab === "measure" && (
            <div className="space-y-4 text-xs text-[#5c574e]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#ded7c8] rounded-xl space-y-1.5">
                  <span className="font-bold text-[#141312] font-mono-meta uppercase tracking-wider block">
                    1. Chest / Bust
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Measure around the fullest part of your chest, keeping the tape horizontally level under your arms.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#ded7c8] rounded-xl space-y-1.5">
                  <span className="font-bold text-[#141312] font-mono-meta uppercase tracking-wider block">
                    2. Garment Length
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Measure from the highest point of the shoulder seam straight down to the bottom hemline.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#ded7c8] rounded-xl space-y-1.5">
                  <span className="font-bold text-[#141312] font-mono-meta uppercase tracking-wider block">
                    3. Shoulder Width
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Measure straight across the back from the tip of one shoulder point to the other.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#ded7c8] rounded-xl space-y-1.5">
                  <span className="font-bold text-[#141312] font-mono-meta uppercase tracking-wider block">
                    4. Sleeve Length
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Measure from the top shoulder seam down along the outer arm to the end of the sleeve cuff.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[#f5f1e8] rounded-xl border border-[#ded7c8] text-xs text-[#5c574e]">
                <p className="font-semibold text-[#141312] mb-1">Tailoring Advice:</p>
                <p>
                  All garments are pre-shrunk heavyweight cottons and raw selvedge weaves. If you prefer an oversized boxy aesthetic, select one size larger than your standard measurement.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#ded7c8] bg-[#f8f5ee] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#141312] hover:bg-[#2b2926] text-[#fbf9f5] text-xs font-mono-meta uppercase tracking-wider font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>

      {/* Fullscreen Image Zoom Overlay */}
      {zoomImage && imageUrl && (
        <div
          onClick={() => setZoomImage(false)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={getMediaUrl(imageUrl)}
              alt="Size Chart Zoomed"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
