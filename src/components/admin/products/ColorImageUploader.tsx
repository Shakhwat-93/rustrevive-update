"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  UploadCloud,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Eye,
  Sparkles,
} from "lucide-react";
import type { ProductMediaItem } from "@/components/admin/products/MediaUploadGrid";

export interface ColorGroup {
  id: string;
  name: string;
  images: ProductMediaItem[];
}

interface ColorImageUploaderProps {
  colors: ColorGroup[];
  onChange: (colors: ColorGroup[]) => void;
  productTitle?: string;
}

const POPULAR_COLORS = [
  "Black",
  "Off-White",
  "Navy Blue",
  "Olive Green",
  "Charcoal",
  "Sand Beige",
  "Burgundy",
  "Rust Brown",
  "Indigo Denim",
  "Heather Grey",
  "Cream",
  "Sage",
];

export function ColorImageUploader({
  colors,
  onChange,
  productTitle = "Product",
}: ColorImageUploaderProps) {
  const [uploadingColorId, setUploadingColorId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newColorInput, setNewColorInput] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Add new color group
  const handleAddColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;

    // Check if color already exists (case-insensitive)
    const exists = colors.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert(`Color "${trimmed}" is already added.`);
      return;
    }

    const newGroup: ColorGroup = {
      id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      images: [],
    };

    onChange([...colors, newGroup]);
    setNewColorInput("");
    setShowAddModal(false);
  };

  // Remove color group
  const handleRemoveColor = (colorId: string) => {
    const target = colors.find((c) => c.id === colorId);
    if (target && target.images.length > 0) {
      if (!confirm(`Are you sure you want to remove "${target.name}" and its ${target.images.length} photo(s)?`)) {
        return;
      }
    }
    onChange(colors.filter((c) => c.id !== colorId));
  };

  // Rename color
  const handleRenameColor = (colorId: string, newName: string) => {
    onChange(
      colors.map((c) => (c.id === colorId ? { ...c, name: newName } : c))
    );
  };

  // Upload files for a specific color
  const handleUploadForColor = async (colorId: string, files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const targetColor = colors.find((c) => c.id === colorId);
    const colorName = targetColor ? targetColor.name : "Garment";

    try {
      setUploadingColorId(colorId);
      setUploadProgress(`Uploading ${files.length} image(s)...`);

      const uploadedItems: ProductMediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt_text", `${productTitle} - ${colorName}`);

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          uploadedItems.push({
            id: json.data.id,
            url: json.data.public_url,
            altText: `${productTitle} - ${colorName}`,
            isPrimary: false,
          });
        }
      }

      if (uploadedItems.length > 0) {
        onChange(
          colors.map((c) => {
            if (c.id !== colorId) return c;
            const updatedImages = [...c.images, ...uploadedItems];
            // Ensure first image is marked primary
            if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrimary)) {
              updatedImages[0]!.isPrimary = true;
            }
            return { ...c, images: updatedImages };
          })
        );
      }
    } catch (err) {
      console.error("Failed to upload color images:", err);
      alert("An error occurred while uploading photos. Please try again.");
    } finally {
      setUploadingColorId(null);
      setUploadProgress(null);
      const inputRef = fileInputRefs.current[colorId];
      if (inputRef) inputRef.value = "";
    }
  };

  // Reorder / set primary within a color group
  const handleSetPrimary = (colorId: string, imageIndex: number) => {
    onChange(
      colors.map((c) => {
        if (c.id !== colorId) return c;
        const targetImage = c.images[imageIndex];
        if (!targetImage) return c;

        const otherImages = c.images.filter((_, i) => i !== imageIndex);
        const reordered = [
          { ...targetImage, isPrimary: true },
          ...otherImages.map((img) => ({ ...img, isPrimary: false })),
        ];
        return { ...c, images: reordered };
      })
    );
  };

  // Move image position (left / right)
  const handleMoveImage = (colorId: string, imageIndex: number, direction: "left" | "right") => {
    onChange(
      colors.map((c) => {
        if (c.id !== colorId) return c;
        const targetIdx = direction === "left" ? imageIndex - 1 : imageIndex + 1;
        if (targetIdx < 0 || targetIdx >= c.images.length) return c;

        const list = [...c.images];
        const current = list[imageIndex];
        const swap = list[targetIdx];
        if (!current || !swap) return c;

        list[imageIndex] = swap;
        list[targetIdx] = current;

        // Auto mark the first item as primary
        return {
          ...c,
          images: list.map((img, idx) => ({ ...img, isPrimary: idx === 0 })),
        };
      })
    );
  };

  // Remove single image from color
  const handleRemoveImage = (colorId: string, imageIndex: number) => {
    onChange(
      colors.map((c) => {
        if (c.id !== colorId) return c;
        const filtered = c.images.filter((_, i) => i !== imageIndex);
        return {
          ...c,
          images: filtered.map((img, idx) => ({ ...img, isPrimary: idx === 0 })),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Color Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Product Colors &amp; Image Galleries</span>
            <span className="px-2 py-0.5 bg-[#f5ecdc] text-[#9e472a] text-[11px] font-mono font-semibold rounded-full">
              {colors.length} {colors.length === 1 ? "Color" : "Colors"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add your available colors. Upload photos for each color so customers see the exact photo when they select that color.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-[#9e472a] hover:bg-[#853920] text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Color</span>
        </button>
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">Add New Color</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type any color name or select from popular presets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddColor(newColorInput);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Color Name
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    placeholder="e.g. Midnight Black, Forest Green, Coral"
                    className="flex-1 px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#9e472a] focus:ring-1 focus:ring-[#9e472a] outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newColorInput.trim()}
                    className="px-4 py-2.5 bg-[#141312] text-white text-xs font-semibold rounded-xl hover:bg-[#9e472a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Popular Color Suggestions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Popular Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_COLORS.map((preset) => {
                  const isAdded = colors.some(
                    (c) => c.name.toLowerCase() === preset.toLowerCase()
                  );
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddColor(preset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        isAdded
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-[#f5ecdc] hover:text-[#9e472a] hover:border-[#9e472a]/30"
                      }`}
                    >
                      {preset} {isAdded && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {colors.length === 0 && (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-[#f5ecdc] text-[#9e472a] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Colors Added Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Click &quot;+ Add Color&quot; above to create colors like Black, Red, White and upload photos for each color.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#141312] text-white text-xs font-semibold rounded-xl hover:bg-[#9e472a] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Color</span>
          </button>
        </div>
      )}

      {/* Color Cards List */}
      <div className="space-y-6">
        {colors.map((colorGroup, colorIdx) => {
          const isCurrentUploading = uploadingColorId === colorGroup.id;

          return (
            <div
              key={colorGroup.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 transition-all"
            >
              {/* Color Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {colorIdx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={colorGroup.name}
                      onChange={(e) => handleRenameColor(colorGroup.id, e.target.value)}
                      placeholder="Color Name"
                      className="text-sm sm:text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#9e472a] focus:bg-slate-50 px-1 py-0.5 rounded-xs outline-none transition-colors max-w-[200px] sm:max-w-xs"
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      ({colorGroup.images.length} {colorGroup.images.length === 1 ? "photo" : "photos"})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={(el) => {
                      fileInputRefs.current[colorGroup.id] = el;
                    }}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleUploadForColor(colorGroup.id, e.target.files);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Upload Button */}
                  <button
                    type="button"
                    disabled={isCurrentUploading}
                    onClick={() => {
                      fileInputRefs.current[colorGroup.id]?.click();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#f5ecdc] hover:bg-[#ebd9c0] text-[#9e472a] text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCurrentUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload {colorGroup.name} Photos</span>
                      </>
                    )}
                  </button>

                  {/* Delete Color */}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(colorGroup.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={`Delete ${colorGroup.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Dropzone / Gallery */}
              {colorGroup.images.length === 0 ? (
                <div
                  onClick={() => {
                    if (!isCurrentUploading) {
                      fileInputRefs.current[colorGroup.id]?.click();
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-[#9e472a] hover:bg-[#fcfaf7] rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#f5ecdc] text-slate-500 group-hover:text-[#9e472a] flex items-center justify-center mx-auto transition-colors">
                    {isCurrentUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#9e472a]" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {isCurrentUploading ? uploadProgress : `Click to Upload Photos for ${colorGroup.name}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select multiple images at once (PNG, JPG, WEBP). 1st photo will be the main photo.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Thumbnails Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {colorGroup.images.map((img, imgIdx) => {
                      const isPrimary = imgIdx === 0 || img.isPrimary;

                      return (
                        <div
                          key={img.id || `${img.url}-${imgIdx}`}
                          className={`group relative aspect-[3/4] rounded-xl overflow-hidden border bg-slate-50 shadow-2xs transition-all ${
                            isPrimary
                              ? "border-[#9e472a] ring-2 ring-[#9e472a]/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {/* Image */}
                          <Image
                            src={img.url}
                            alt={img.altText || `${colorGroup.name} view ${imgIdx + 1}`}
                            fill
                            className="object-contain p-1"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          />

                          {/* Primary Badge */}
                          {isPrimary && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              <span className="px-1.5 py-0.5 bg-[#9e472a] text-white text-[9px] font-mono font-bold uppercase rounded shadow-xs flex items-center space-x-1">
                                <Star className="w-2.5 h-2.5 fill-white" />
                                <span>MAIN</span>
                              </span>
                            </div>
                          )}

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            {/* Top Controls: Preview & Delete */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(img.url)}
                                className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveImage(colorGroup.id, imgIdx)}
                                className="p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md shadow-xs transition-colors cursor-pointer"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Bottom Controls: Make Primary & Reorder */}
                            <div className="space-y-1">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(colorGroup.id, imgIdx)}
                                  className="w-full py-1 bg-white text-[#9e472a] hover:bg-[#f5ecdc] text-[10px] font-bold rounded shadow-xs transition-colors cursor-pointer"
                                >
                                  Make Main
                                </button>
                              )}

                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  disabled={imgIdx === 0}
                                  onClick={() => handleMoveImage(colorGroup.id, imgIdx, "left")}
                                  className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded shadow-xs disabled:opacity-30 cursor-pointer"
                                  title="Move Left"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={imgIdx === colorGroup.images.length - 1}
                                  onClick={() => handleMoveImage(colorGroup.id, imgIdx, "right")}
                                  className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded shadow-xs disabled:opacity-30 cursor-pointer"
                                  title="Move Right"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add More Photos Card in Grid */}
                    <div
                      onClick={() => {
                        if (!isCurrentUploading) {
                          fileInputRefs.current[colorGroup.id]?.click();
                        }
                      }}
                      className="aspect-[3/4] border-2 border-dashed border-slate-200 hover:border-[#9e472a] hover:bg-[#fcfaf7] rounded-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors group"
                    >
                      <Plus className="w-6 h-6 text-slate-400 group-hover:text-[#9e472a] transition-colors" />
                      <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#9e472a] mt-1">
                        + Add Photos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={previewImage}
                alt="Product preview"
                fill
                className="object-contain"
                sizes="80vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
