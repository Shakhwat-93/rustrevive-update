"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Upload,
  Search,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  FileImage,
} from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  publicUrl: string;
  sizeBytes: number;
  dimensions: string;
  mimeType: string;
  uploadedAt: string;
  referencesCount: number;
}

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: "med-1",
    filename: "autumn-hero-fashion-model-35mm.webp",
    publicUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop",
    sizeBytes: 482000,
    dimensions: "2000 × 1333",
    mimeType: "image/webp",
    uploadedAt: "2026-08-18",
    referencesCount: 2,
  },
  {
    id: "med-2",
    filename: "vintage-washed-leather-aviator-jacket.webp",
    publicUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000&auto=format&fit=crop",
    sizeBytes: 612000,
    dimensions: "2000 × 1333",
    mimeType: "image/webp",
    uploadedAt: "2026-08-18",
    referencesCount: 3,
  },
  {
    id: "med-3",
    filename: "14-5oz-raw-selvedge-denim-jeans.webp",
    publicUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=2000&auto=format&fit=crop",
    sizeBytes: 540000,
    dimensions: "2000 × 1333",
    mimeType: "image/webp",
    uploadedAt: "2026-08-17",
    referencesCount: 4,
  },
  {
    id: "med-4",
    filename: "280gsm-heavyweight-boxy-cut-tee.webp",
    publicUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop",
    sizeBytes: 320000,
    dimensions: "1000 × 1250",
    mimeType: "image/webp",
    uploadedAt: "2026-08-16",
    referencesCount: 2,
  },
  {
    id: "med-5",
    filename: "vegetable-tanned-leather-brass-belt.webp",
    publicUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop",
    sizeBytes: 290000,
    dimensions: "1000 × 1250",
    mimeType: "image/webp",
    uploadedAt: "2026-08-15",
    referencesCount: 2,
  },
  {
    id: "med-6",
    filename: "dhaka-atelier-brand-story-craft.webp",
    publicUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
    sizeBytes: 780000,
    dimensions: "1600 × 1066",
    mimeType: "image/webp",
    uploadedAt: "2026-08-14",
    referencesCount: 1,
  },
];

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(INITIAL_MEDIA[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMedia = mediaList.filter((m) =>
    m.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUploadSimulate = () => {
    const newMedia: MediaItem = {
      id: `med-${Date.now()}`,
      filename: `new-campaign-upload-${Date.now().toString().slice(-4)}.webp`,
      publicUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop",
      sizeBytes: 420000,
      dimensions: "1600 × 1066",
      mimeType: "image/webp",
      uploadedAt: new Date().toISOString().split("T")[0]!,
      referencesCount: 0,
    };
    setMediaList((prev) => [newMedia, ...prev]);
    setSelectedMedia(newMedia);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this media asset from Cloudflare R2 bucket?")) {
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      if (selectedMedia?.id === id) {
        setSelectedMedia(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Media Library</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
              Cloudflare R2 Bucket
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Direct high-speed media delivery via media.rustrevive.store CDN.
          </p>
        </div>

        <button
          onClick={handleUploadSimulate}
          className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Main Grid: Left Catalog + Right Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8/9 Cols: Media Gallery Grid */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename..."
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 text-xs rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {filteredMedia.map((item) => {
              const isSelected = selectedMedia?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className={`group relative aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-[#9e472a] border-[#9e472a]"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Image
                    src={item.publicUrl}
                    alt={item.filename}
                    fill
                    sizes="200px"
                    className="object-cover object-center"
                  />

                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px] text-white">
                    <span className="truncate font-medium">{item.filename}</span>
                    <span className="text-slate-300 font-mono">
                      {(item.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Selected Asset Metadata Inspector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {selectedMedia ? (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Asset Metadata
              </h2>

              {/* Preview Thumbnail */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src={selectedMedia.publicUrl}
                  alt={selectedMedia.filename}
                  fill
                  sizes="300px"
                  className="object-cover object-center"
                />
              </div>

              {/* File Specs */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Filename
                  </span>
                  <span className="font-medium text-slate-800 break-all">
                    {selectedMedia.filename}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      Dimensions
                    </span>
                    <span className="font-mono text-slate-700">
                      {selectedMedia.dimensions}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      File Size
                    </span>
                    <span className="font-mono text-slate-700">
                      {(selectedMedia.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      Format
                    </span>
                    <span className="font-mono text-slate-700">
                      {selectedMedia.mimeType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">
                      Usage
                    </span>
                    <span className="font-mono text-slate-700">
                      {selectedMedia.referencesCount} references
                    </span>
                  </div>
                </div>
              </div>

              {/* CDN URL Copy Button */}
              <div className="pt-2">
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Cloudflare R2 CDN URL
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    readOnly
                    value={selectedMedia.publicUrl}
                    className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-600 truncate focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyUrl(selectedMedia.publicUrl, selectedMedia.id)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Copy CDN URL"
                  >
                    {copiedId === selectedMedia.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={selectedMedia.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open asset</span>
                </a>

                <button
                  onClick={() => handleDelete(selectedMedia.id)}
                  className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <FileImage className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p>Select a media asset to inspect metadata.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
