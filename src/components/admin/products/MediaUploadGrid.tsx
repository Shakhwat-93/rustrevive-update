"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Star,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  X,
  Check,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media/media-url";

export interface ProductMediaItem {
  id?: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

interface MediaUploadGridProps {
  images: ProductMediaItem[];
  onChange: (images: ProductMediaItem[]) => void;
  productTitle?: string;
}

export function MediaUploadGrid({
  images,
  onChange,
  productTitle = "Product",
}: MediaUploadGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<{ id: string; public_url: string; original_filename?: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  // File Upload to Cloudflare R2
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const newMediaList: ProductMediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt_text", productTitle || file.name);

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          newMediaList.push({
            id: json.data.id,
            url: json.data.public_url,
            altText: json.data.original_filename || productTitle,
            isPrimary: false,
          });
        }
      }

      if (newMediaList.length > 0) {
        const currentList = images.filter((img) => !img.url.includes("placeholder"));
        const combined = [...currentList, ...newMediaList];
        // Ensure first item is marked primary if none is
        if (!combined.some((img) => img.isPrimary) && combined[0]) {
          combined[0].isPrimary = true;
        }
        onChange(combined);
      }
    } catch (err) {
      console.error("Failed to upload media files:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Set Primary Image
  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    // Move primary to index 0 for consistent ordering
    const primaryItem = updated[index];
    if (primaryItem) {
      const rest = updated.filter((_, i) => i !== index);
      onChange([primaryItem, ...rest]);
    } else {
      onChange(updated);
    }
  };

  // Remove Image
  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary) && updated[0]) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  // Move Image Position
  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const list = [...images];
    const item = list[index];
    const targetItem = list[targetIndex];
    if (item && targetItem) {
      list[index] = targetItem;
      list[targetIndex] = item;
      // Maintain primary status for first position if intended
      if (targetIndex === 0) {
        list.forEach((img, i) => (img.isPrimary = i === 0));
      }
      onChange(list);
    }
  };

  // Add Direct URL
  const handleAddUrl = () => {
    if (!imageUrlInput.trim()) return;
    const currentList = images.filter((img) => !img.url.includes("placeholder"));
    const updated = [
      ...currentList,
      {
        url: imageUrlInput.trim(),
        altText: productTitle,
        isPrimary: currentList.length === 0,
      },
    ];
    onChange(updated);
    setImageUrlInput("");
    setShowUrlInput(false);
  };

  // Open Media Library Modal
  const openLibrary = async () => {
    setShowLibraryModal(true);
    try {
      setLoadingLibrary(true);
      const res = await fetch("/api/admin/media?limit=40");
      const json = await res.json();
      if (json.success && json.data) {
        setLibraryAssets(json.data.media || []);
      }
    } catch (err) {
      console.error("Failed to load media library:", err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const selectFromLibrary = (asset: { id: string; public_url: string; original_filename?: string }) => {
    const currentList = images.filter((img) => !img.url.includes("placeholder"));
    // Check if already selected
    if (currentList.some((img) => img.url === asset.public_url || img.id === asset.id)) {
      return;
    }
    const updated = [
      ...currentList,
      {
        id: asset.id,
        url: asset.public_url,
        altText: asset.original_filename || productTitle,
        isPrimary: currentList.length === 0,
      },
    ];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[#9e472a] bg-[#9e472a]/5 scale-[0.99]"
            : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2 py-4">
            <Loader2 className="w-8 h-8 text-[#9e472a] animate-spin" />
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Optimizing & Uploading to R2...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600">
              <UploadCloud className="w-6 h-6 text-[#9e472a]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Click to upload <span className="text-slate-500 font-normal">or drag and drop</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                PNG, JPG, WEBP or AVIF (auto-converted to lightweight WebP)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Action Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={openLibrary}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Select from Library</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
        >
          {showUrlInput ? "Cancel URL input" : "+ Add image from URL"}
        </button>
      </div>

      {/* Optional Direct URL Input */}
      {showUrlInput && (
        <div className="flex gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="url"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="https://example.com/garment-photo.jpg"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-900"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Uploaded Media Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => {
            const isPrimary = idx === 0 || img.isPrimary;
            return (
              <div
                key={img.id || `${img.url}-${idx}`}
                className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border transition-all ${
                  isPrimary
                    ? "ring-2 ring-[#9e472a] border-[#9e472a] shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Image Preview */}
                <Image
                  src={getMediaUrl(img.url)}
                  alt={img.altText || `Product Image ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover object-center"
                />

                {/* Primary / Cover Badge */}
                {isPrimary && (
                  <span className="absolute top-2 left-2 bg-[#9e472a] text-white text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded shadow-xs uppercase">
                    Cover
                  </span>
                )}

                {/* Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center">
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => setPrimary(idx)}
                        title="Set as Cover"
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-md shadow-xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      title="Delete Image"
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reorder Left / Right */}
                  <div className="flex justify-between items-center">
                    {idx > 0 ? (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, "left")}
                        title="Move Left"
                        className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded shadow-xs transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                    {idx < images.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, "right")}
                        title="Move Right"
                        className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded shadow-xs transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Library Selector Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-[#9e472a]" />
                <h3 className="text-base font-semibold text-slate-900">Select Media from Library</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Assets Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingLibrary ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 text-[#9e472a] animate-spin" />
                  <p className="text-xs text-slate-500">Loading Cloudflare R2 assets...</p>
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No previous media files found. Upload a file above.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {libraryAssets.map((asset) => {
                    const isSelected = images.some((img) => img.url === asset.public_url || img.id === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => selectFromLibrary(asset)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${
                          isSelected
                            ? "ring-2 ring-[#9e472a] border-[#9e472a] opacity-60"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <Image
                          src={getMediaUrl(asset.public_url)}
                          alt={asset.original_filename || "Asset"}
                          fill
                          sizes="(max-width: 640px) 33vw, 20vw"
                          className="object-cover object-center"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#9e472a]/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
