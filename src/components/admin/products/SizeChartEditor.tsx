"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Ruler,
  Table as TableIcon,
  Image as ImageIcon,
  Plus,
  Trash2,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";

export interface SizeChartTableRow {
  id: string;
  size: string;
  chest?: string;
  length?: string;
  shoulder?: string;
  sleeve?: string;
  waist?: string;
  hip?: string;
}

export interface SizeChartData {
  mode: "table" | "image" | "both" | "none";
  unit: "in" | "cm";
  columns: string[];
  rows: SizeChartTableRow[];
  imageUrl?: string;
  note?: string;
}

const DEFAULT_PRESETS: Record<string, { columns: string[]; rows: SizeChartTableRow[] }> = {
  "T-Shirt / Tops": {
    columns: ["Size", "Chest", "Length", "Shoulder", "Sleeve"],
    rows: [
      { id: "1", size: "S", chest: "38", length: "27", shoulder: "17.5", sleeve: "8" },
      { id: "2", size: "M", chest: "40", length: "28", shoulder: "18.5", sleeve: "8.5" },
      { id: "3", size: "L", chest: "42", length: "29", shoulder: "19.5", sleeve: "9" },
      { id: "4", size: "XL", chest: "44", length: "30", shoulder: "20.5", sleeve: "9.5" },
      { id: "5", size: "XXL", chest: "46", length: "31", shoulder: "21.5", sleeve: "10" },
    ],
  },
  "Shirts / Button-downs": {
    columns: ["Size", "Chest", "Length", "Shoulder", "Sleeve"],
    rows: [
      { id: "1", size: "S", chest: "39", length: "29", shoulder: "18", sleeve: "24.5" },
      { id: "2", size: "M", chest: "41", length: "30", shoulder: "19", sleeve: "25" },
      { id: "3", size: "L", chest: "43", length: "31", shoulder: "20", sleeve: "25.5" },
      { id: "4", size: "XL", chest: "45", length: "32", shoulder: "21", sleeve: "26" },
    ],
  },
  "Pants / Denim": {
    columns: ["Size", "Waist", "Length", "Hip", "Thigh"],
    rows: [
      { id: "1", size: "30", chest: "30", length: "40", shoulder: "38", sleeve: "22" },
      { id: "2", size: "32", chest: "32", length: "41", shoulder: "40", sleeve: "23" },
      { id: "3", size: "34", chest: "34", length: "42", shoulder: "42", sleeve: "24" },
      { id: "4", size: "36", chest: "36", length: "42", shoulder: "44", sleeve: "25" },
    ],
  },
};

interface SizeChartEditorProps {
  value?: SizeChartData;
  onChange: (data: SizeChartData) => void;
  productTitle?: string;
}

export function SizeChartEditor({
  value,
  onChange,
  productTitle = "Product",
}: SizeChartEditorProps) {
  const [chartData, setChartData] = useState<SizeChartData>(
    value || {
      mode: "table",
      unit: "in",
      columns: DEFAULT_PRESETS["T-Shirt / Tops"]!.columns,
      rows: DEFAULT_PRESETS["T-Shirt / Tops"]!.rows,
      imageUrl: "",
      note: "All measurements are in inches. True to size with a tailored relaxed fit.",
    }
  );

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateChart = (partial: Partial<SizeChartData>) => {
    const updated = { ...chartData, ...partial };
    setChartData(updated);
    onChange(updated);
  };

  // Preset Applicator
  const applyPreset = (presetName: string) => {
    const preset = DEFAULT_PRESETS[presetName];
    if (preset) {
      updateChart({
        columns: [...preset.columns],
        rows: preset.rows.map((r) => ({ ...r })),
      });
    }
  };

  // Add row
  const addRow = () => {
    const newId = `row-${Date.now()}`;
    const newRow: SizeChartTableRow = {
      id: newId,
      size: "Custom",
      chest: "",
      length: "",
      shoulder: "",
      sleeve: "",
    };
    updateChart({ rows: [...chartData.rows, newRow] });
  };

  // Remove row
  const removeRow = (rowId: string) => {
    updateChart({ rows: chartData.rows.filter((r) => r.id !== rowId) });
  };

  // Edit cell
  const updateCell = (rowIndex: number, field: keyof SizeChartTableRow, val: string) => {
    const updatedRows = [...chartData.rows];
    const target = updatedRows[rowIndex];
    if (target) {
      updatedRows[rowIndex] = { ...target, [field]: val };
      updateChart({ rows: updatedRows });
    }
  };

  // File Upload to Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", `${productTitle} Size Chart`);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        updateChart({ imageUrl: json.data.public_url });
      }
    } catch (err) {
      console.error("Size chart image upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-[#9e472a]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Size Chart Format:
          </span>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => updateChart({ mode: "table" })}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              chartData.mode === "table"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 inline mr-1" />
            Size Table
          </button>

          <button
            type="button"
            onClick={() => updateChart({ mode: "image" })}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              chartData.mode === "image"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
            Chart Image
          </button>

          <button
            type="button"
            onClick={() => updateChart({ mode: "both" })}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              chartData.mode === "both"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Table & Image
          </button>

          <button
            type="button"
            onClick={() => updateChart({ mode: "none" })}
            className={`px-2.5 py-1 font-medium rounded-md transition-all ${
              chartData.mode === "none"
                ? "bg-rose-50 text-rose-700 shadow-2xs font-semibold"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Disabled
          </button>
        </div>
      </div>

      {chartData.mode === "none" ? (
        <p className="text-xs text-slate-500 italic py-2">
          Size chart is disabled for this product.
        </p>
      ) : (
        <div className="space-y-5">
          {/* 1. TABLE BUILDER */}
          {(chartData.mode === "table" || chartData.mode === "both") && (
            <div className="space-y-3">
              {/* Presets & Unit Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px]">Presets:</span>
                  {Object.keys(DEFAULT_PRESETS).map((pName) => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => applyPreset(pName)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                    >
                      {pName}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-[11px]">Units:</span>
                  <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => updateChart({ unit: "in" })}
                      className={`px-2 py-0.5 rounded ${
                        chartData.unit === "in"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      Inches (in)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateChart({ unit: "cm" })}
                      className={`px-2 py-0.5 rounded ${
                        chartData.unit === "cm"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      CM (cm)
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Chest ({chartData.unit})</th>
                        <th className="py-2.5 px-3">Length ({chartData.unit})</th>
                        <th className="py-2.5 px-3">Shoulder ({chartData.unit})</th>
                        <th className="py-2.5 px-3">Sleeve ({chartData.unit})</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {chartData.rows.map((row, rIdx) => (
                        <tr key={row.id || rIdx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 font-sans">
                            <input
                              type="text"
                              value={row.size}
                              onChange={(e) => updateCell(rIdx, "size", e.target.value)}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.chest || ""}
                              onChange={(e) => updateCell(rIdx, "chest", e.target.value)}
                              placeholder="38"
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.length || ""}
                              onChange={(e) => updateCell(rIdx, "length", e.target.value)}
                              placeholder="28"
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.shoulder || ""}
                              onChange={(e) => updateCell(rIdx, "shoulder", e.target.value)}
                              placeholder="18"
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.sleeve || ""}
                              onChange={(e) => updateCell(rIdx, "sleeve", e.target.value)}
                              placeholder="8.5"
                              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              title="Delete Row"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-slate-50/50 border-t border-slate-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center space-x-1 text-xs text-[#9e472a] hover:text-[#7d361f] font-semibold px-2 py-1 rounded hover:bg-[#9e472a]/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Size Row</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. IMAGE UPLOADER */}
          {(chartData.mode === "image" || chartData.mode === "both") && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={handleImageUpload}
              />

              {chartData.imageUrl ? (
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    <Image
                      src={getMediaUrl(chartData.imageUrl)}
                      alt="Size Chart"
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h5 className="text-xs font-bold text-slate-900">Custom Size Chart Image Attached</h5>
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                      {chartData.imageUrl}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-2xs transition-colors"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={() => updateChart({ imageUrl: "" })}
                        className="px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 font-medium rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="w-6 h-6 text-[#9e472a] animate-spin" />
                      <p className="text-xs font-semibold text-slate-700">Uploading Size Chart...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <UploadCloud className="w-6 h-6 text-[#9e472a]" />
                      <p className="text-xs font-semibold text-slate-900">
                        Upload Size Chart Image (PNG, JPG, WEBP)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Direct measurement infographic or brand size guide photo
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sizing Note / Advice */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Sizing Notes / Fit Guidance (optional)
            </label>
            <input
              type="text"
              value={chartData.note || ""}
              onChange={(e) => updateChart({ note: e.target.value })}
              placeholder="e.g. True to size. For an oversized streetwear silhouette, order one size up."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
