"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Upload, Trash2, Copy, Check, RefreshCw, Image as ImageIcon, Loader2 } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/admin/ui/admin-skeleton";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { getMediaUrl } from "@/lib/media/media-url";

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
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast, confirm } = useAdminDialog();

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
    showToast("CDN image URL copied to clipboard", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to upload media to Cloudflare R2", "error");
        return;
      }

      showToast(`Uploaded ${file.name} to Cloudflare R2`, "success");
      await loadMedia();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload error", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Media Asset?",
      message: "Are you sure you want to delete this media item from Cloudflare R2? This action cannot be undone.",
      confirmText: "Delete Asset",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error?.message || "Failed to delete media", "error");
        return;
      }
      showToast("Media asset deleted", "success");
      await loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete error";
      showToast(`Error: ${msg}`, "error");
    }
  };

  return (
    <AdminPageLayout
      title="Media Library"
      subtitle="Upload and manage Cloudflare R2 images with direct CDN delivery."
      badge={
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {mediaList.length} assets
        </span>
      }
      actions={
        <>
          <AdminButton variant="ghost" icon={RefreshCw} onClick={loadMedia} isLoading={loading}>
            Refresh
          </AdminButton>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              disabled={uploading}
              onChange={handleFileUpload}
            />
            <div className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#9e472a] hover:bg-[#853a20] text-white shadow-xs transition-colors">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? "Uploading..." : "Upload Image"}</span>
            </div>
          </label>
        </>
      }
    >
      {loading ? (
        <TableSkeleton rows={4} />
      ) : mediaList.length === 0 ? (
        <AdminEmptyState
          icon={ImageIcon}
          title="No media uploaded"
          description="Upload high-resolution editorial photos and garment mockups directly to your Cloudflare R2 bucket."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div className="relative aspect-3/4 bg-slate-100 overflow-hidden">
                <Image
                  src={getMediaUrl(item.public_url)}
                  alt={item.original_filename || "Media"}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-3 space-y-2 border-t border-slate-100 bg-white">
                <div className="text-[11px] font-medium text-slate-800 truncate" title={item.original_filename}>
                  {item.original_filename}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{(item.file_size / 1024).toFixed(0)} KB</span>
                  <span>{item.mime_type.split("/")[1]?.toUpperCase()}</span>
                </div>

                <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-50">
                  <button
                    onClick={() => handleCopy(item.id, item.public_url)}
                    className="flex-1 py-1 px-2 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-mono font-medium flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === item.id ? "Copied" : "Copy CDN"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    title="Delete image"
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
