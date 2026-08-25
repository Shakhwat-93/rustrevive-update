"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  DollarSign,
  Package,
  Hash,
  X,
} from "lucide-react";
import type { ProductMediaItem } from "./MediaUploadGrid";

export interface OptionConfig {
  id: string;
  name: string;
  values: string[];
}

export interface GeneratedVariant {
  id?: string;
  title: string;
  sku: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock: number;
  weight?: number;
  option_1_name?: string;
  option_1_value?: string;
  option_2_name?: string;
  option_2_value?: string;
  option_3_name?: string;
  option_3_value?: string;
  image_url?: string;
  media_id?: string;
}

interface VariantMatrixEditorProps {
  basePrice: number;
  baseSku: string;
  productImages: ProductMediaItem[];
  options: OptionConfig[];
  onOptionsChange: (options: OptionConfig[]) => void;
  variants: GeneratedVariant[];
  onVariantsChange: (variants: GeneratedVariant[]) => void;
}

export function VariantMatrixEditor({
  basePrice,
  baseSku,
  productImages,
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
}: VariantMatrixEditorProps) {
  const [activeValueInputs, setActiveValueInputs] = useState<Record<string, string>>({});
  const [selectedVariantIdxs, setSelectedVariantIdxs] = useState<number[]>([]);
  const [bulkPriceInput, setBulkPriceInput] = useState<string>("");
  const [bulkStockInput, setBulkStockInput] = useState<string>("");
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState<string>("");
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [showBulkSkuModal, setShowBulkSkuModal] = useState(false);

  // Common option name suggestions
  const optionSuggestions = ["Size", "Color", "Material", "Style", "Fit"];

  // Add a new option
  const addOption = (defaultName = "Size") => {
    const newId = `opt-${Date.now()}`;
    const newOption: OptionConfig = {
      id: newId,
      name: defaultName,
      values: defaultName === "Size" ? ["S", "M", "L", "XL"] : [],
    };
    onOptionsChange([...options, newOption]);
  };

  // Remove an option
  const removeOption = (id: string) => {
    onOptionsChange(options.filter((o) => o.id !== id));
  };

  // Update option name
  const updateOptionName = (id: string, name: string) => {
    onOptionsChange(options.map((o) => (o.id === id ? { ...o, name } : o)));
  };

  // Add value pill to option
  const addOptionValue = (optionId: string, valueStr: string) => {
    const trimmed = valueStr.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;

    onOptionsChange(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        if (opt.values.includes(trimmed)) return opt;
        return { ...opt, values: [...opt.values, trimmed] };
      })
    );

    setActiveValueInputs((prev) => ({ ...prev, [optionId]: "" }));
  };

  // Remove value pill
  const removeOptionValue = (optionId: string, valueToRemove: string) => {
    onOptionsChange(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        return { ...opt, values: opt.values.filter((v) => v !== valueToRemove) };
      })
    );
  };

  // Cartesian Product Generator for Variant Combinations
  const generateCartesianCombinations = (opts: OptionConfig[]): GeneratedVariant[] => {
    const validOptions = opts.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) return [];

    let combinations: { values: { name: string; value: string }[] }[] = [
      { values: [] },
    ];

    for (const opt of validOptions) {
      const next: { values: { name: string; value: string }[] }[] = [];
      for (const comb of combinations) {
        for (const val of opt.values) {
          next.push({
            values: [...comb.values, { name: opt.name, value: val }],
          });
        }
      }
      combinations = next;
    }

    return combinations.map((comb) => {
      const title = comb.values.map((v) => v.value).join(" / ");
      const opt1 = comb.values[0];
      const opt2 = comb.values[1];
      const opt3 = comb.values[2];

      // Smart SKU generation
      const skuSuffix = comb.values
        .map((v) => v.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))
        .join("-");
      const defaultSku = baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix;

      // Preserve existing values if variant with same options already exists
      const existing = variants.find(
        (v) =>
          v.option_1_value === opt1?.value &&
          (opt2 ? v.option_2_value === opt2.value : true) &&
          (opt3 ? v.option_3_value === opt3.value : true)
      );

      if (existing) {
        return {
          ...existing,
          title,
          option_1_name: opt1?.name,
          option_1_value: opt1?.value,
          option_2_name: opt2?.name,
          option_2_value: opt2?.value,
          option_3_name: opt3?.name,
          option_3_value: opt3?.value,
        };
      }

      return {
        title,
        sku: defaultSku,
        price: basePrice || 0,
        stock: 10,
        option_1_name: opt1?.name,
        option_1_value: opt1?.value,
        option_2_name: opt2?.name,
        option_2_value: opt2?.value,
        option_3_name: opt3?.name,
        option_3_value: opt3?.value,
      };
    });
  };

  // Re-generate combinations whenever options change
  const handleRegenerate = () => {
    const updated = generateCartesianCombinations(options);
    onVariantsChange(updated);
    setSelectedVariantIdxs([]);
  };

  // Individual field change on a variant
  const updateVariantField = (
    index: number,
    field: keyof GeneratedVariant,
    val: string | number | undefined
  ) => {
    const updated = [...variants];
    const target = updated[index];
    if (target) {
      updated[index] = { ...target, [field]: val };
      onVariantsChange(updated);
    }
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedVariantIdxs.length === variants.length) {
      setSelectedVariantIdxs([]);
    } else {
      setSelectedVariantIdxs(variants.map((_, i) => i));
    }
  };

  const toggleSelectRow = (index: number) => {
    if (selectedVariantIdxs.includes(index)) {
      setSelectedVariantIdxs(selectedVariantIdxs.filter((i) => i !== index));
    } else {
      setSelectedVariantIdxs([...selectedVariantIdxs, index]);
    }
  };

  const applyBulkPrice = () => {
    const num = parseFloat(bulkPriceInput);
    if (isNaN(num) || num < 0) return;
    const updated = variants.map((v, i) =>
      selectedVariantIdxs.includes(i) ? { ...v, price: num } : v
    );
    onVariantsChange(updated);
    setShowBulkPriceModal(false);
    setBulkPriceInput("");
  };

  const applyBulkStock = () => {
    const num = parseInt(bulkStockInput, 10);
    if (isNaN(num) || num < 0) return;
    const updated = variants.map((v, i) =>
      selectedVariantIdxs.includes(i) ? { ...v, stock: num } : v
    );
    onVariantsChange(updated);
    setShowBulkStockModal(false);
    setBulkStockInput("");
  };

  const applyBulkSkuPrefix = () => {
    const prefix = bulkSkuPrefix.trim();
    if (!prefix) return;
    const updated = variants.map((v, i) => {
      if (!selectedVariantIdxs.includes(i)) return v;
      const parts = v.sku.split("-");
      const suffix = parts.length > 1 ? parts.slice(1).join("-") : v.title.replace(/\s+/g, "");
      return { ...v, sku: `${prefix}-${suffix}` };
    });
    onVariantsChange(updated);
    setShowBulkSkuModal(false);
    setBulkSkuPrefix("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Option Definitions Builder */}
      <div className="space-y-4">
        {options.map((opt, optIdx) => (
          <div
            key={opt.id}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Option {optIdx + 1}:
                </span>
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOptionName(opt.id, e.target.value)}
                  placeholder="e.g. Size, Color"
                  className="px-2.5 py-1 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 w-36"
                />
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">Quick:</span>
                {optionSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => updateOptionName(opt.id, sug)}
                    className="px-1.5 py-0.5 text-[10px] text-slate-600 bg-white hover:bg-slate-200 border border-slate-200 rounded transition-colors"
                  >
                    {sug}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  title="Delete Option"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Option Values Pills */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Option Values (press Enter or Comma to add):</label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-lg min-h-[42px] focus-within:border-slate-900">
                {opt.values.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md border border-slate-200"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => removeOptionValue(opt.id, val)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={activeValueInputs[opt.id] || ""}
                  onChange={(e) =>
                    setActiveValueInputs((prev) => ({ ...prev, [opt.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addOptionValue(opt.id, activeValueInputs[opt.id] || "");
                    }
                  }}
                  onBlur={() => {
                    if (activeValueInputs[opt.id]) {
                      addOptionValue(opt.id, activeValueInputs[opt.id] || "");
                    }
                  }}
                  placeholder={opt.values.length === 0 ? "Add value like Small, Red..." : "Add another..."}
                  className="flex-1 min-w-[120px] px-2 py-0.5 text-xs text-slate-900 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Option Button */}
        <div className="flex flex-wrap items-center gap-2">
          {options.length < 3 && (
            <button
              type="button"
              onClick={() => addOption(options.length === 0 ? "Size" : options.length === 1 ? "Color" : "Material")}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add another option (e.g. Size, Color)</span>
            </button>
          )}

          {options.length > 0 && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#9e472a] hover:text-[#7d361f] bg-[#9e472a]/10 hover:bg-[#9e472a]/15 px-3 py-1.5 rounded-lg transition-colors ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update Variant Matrix ({variants.length} combinations)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Variant Matrix Table with Bulk Actions */}
      {variants.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs space-y-0">
          {/* Bulk Action Header Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center space-x-1.5 text-slate-700 font-medium hover:text-slate-900"
              >
                {selectedVariantIdxs.length === variants.length ? (
                  <CheckSquare className="w-4 h-4 text-[#9e472a]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  Select All ({selectedVariantIdxs.length}/{variants.length})
                </span>
              </button>
            </div>

            {/* Bulk Trigger Buttons */}
            {selectedVariantIdxs.length > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => setShowBulkPriceModal(true)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-medium flex items-center space-x-1 transition-colors"
                >
                  <DollarSign className="w-3 h-3 text-slate-500" />
                  <span>Set Price</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkStockModal(true)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-medium flex items-center space-x-1 transition-colors"
                >
                  <Package className="w-3 h-3 text-slate-500" />
                  <span>Set Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkSkuModal(true)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-medium flex items-center space-x-1 transition-colors"
                >
                  <Hash className="w-3 h-3 text-slate-500" />
                  <span>Set SKU Prefix</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-medium uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3">Price (৳)</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((variant, idx) => {
                  const isSelected = selectedVariantIdxs.includes(idx);
                  return (
                    <tr
                      key={`${variant.title}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-[#9e472a]/5" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(idx)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#9e472a]" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {variant.title}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariantField(idx, "price", parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-900 font-mono text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariantField(idx, "sku", e.target.value)}
                          className="w-32 px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-900 font-mono text-slate-900 uppercase"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariantField(idx, "stock", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-900 font-mono text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        {productImages.length > 0 ? (
                          <select
                            value={variant.image_url || ""}
                            onChange={(e) => updateVariantField(idx, "image_url", e.target.value)}
                            className="text-[11px] px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none text-slate-700"
                          >
                            <option value="">Default Cover</option>
                            {productImages.map((img, i) => (
                              <option key={img.url || i} value={img.url}>
                                Photo {i + 1} {img.isPrimary ? "(Cover)" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-400">No media</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
            {variants.map((variant, idx) => {
              const isSelected = selectedVariantIdxs.includes(idx);
              return (
                <div
                  key={`m-${variant.title}-${idx}`}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-[#9e472a]/5 border-[#9e472a]"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleSelectRow(idx)}
                      className="flex items-center space-x-2 font-semibold text-slate-900 text-xs"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#9e472a]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{variant.title}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Price (৳)</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariantField(idx, "price", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase">Stock</label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariantField(idx, "stock", parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase">SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariantField(idx, "sku", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Set Price for {selectedVariantIdxs.length} selected variants
            </h4>
            <input
              type="number"
              value={bulkPriceInput}
              onChange={(e) => setBulkPriceInput(e.target.value)}
              placeholder="e.g. 4500"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-slate-900"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkPriceModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulkPrice}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Apply Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Stock Modal */}
      {showBulkStockModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Set Stock for {selectedVariantIdxs.length} selected variants
            </h4>
            <input
              type="number"
              value={bulkStockInput}
              onChange={(e) => setBulkStockInput(e.target.value)}
              placeholder="e.g. 20"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-slate-900"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulkStock}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Apply Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SKU Modal */}
      {showBulkSkuModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Set SKU Prefix for {selectedVariantIdxs.length} selected variants
            </h4>
            <input
              type="text"
              value={bulkSkuPrefix}
              onChange={(e) => setBulkSkuPrefix(e.target.value)}
              placeholder="e.g. RR-TEE"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-slate-900 uppercase"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkSkuModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulkSkuPrefix}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Apply Prefix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
