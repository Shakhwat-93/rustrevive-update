"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Upload, Trash2, Copy, Check, RefreshCw, Image as ImageIcon } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";

interface MediaItem {
  id: string;
  public_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/media");
      const json = await res.json();
      if (json.success && json.data) {
        setMediaList(json.data.media || []);
      }
    } catch (err) {
      console.error("Failed to load media assets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;

    try {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error?.message || "Failed to delete media");
        return;
      }
      await loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete error";
      alert(`Error: ${msg}`);
    }
  };

  return (
    <AdminPageLayout
      title="Media Library"
      subtitle="Upload and manage Cloudflare R2 images with safe reference-checked deletion."
      actions={
        <>
          <AdminButton variant="ghost" icon={RefreshCw} onClick={loadMedia}>
            Refresh
          </AdminButton>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={() => alert("Direct R2 Presigned Upload configured for production.")}
            />
            <div className="inline-flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#9e472a] hover:bg-[#853a20] text-white shadow-xs transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload to R2</span>
            </div>
          </label>
        </>
      }
    >
      {loading ? (
        <TableSkeleton rows={5} />
      ) : mediaList.length === 0 ? (
        <AdminEmptyState
          icon={ImageIcon}
          title="No media assets uploaded yet"
          description="Uploaded product photos, hero banners, and lookbooks will appear here directly from your Cloudflare R2 bucket."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all"
            >
              <div className="relative aspect-square bg-slate-100">
                <Image
                  src={item.public_url}
                  alt={item.original_filename}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-slate-800 truncate" title={item.original_filename}>
                  {item.original_filename}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {(item.file_size / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleCopy(item.id, item.public_url)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === item.id ? "Copied" : "URL"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
