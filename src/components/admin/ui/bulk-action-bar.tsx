"use client";

import React from "react";
import { CheckSquare, X, Tag, FolderPlus, Archive, Trash2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onBulkStatusChange?: (status: string) => void;
  onBulkCategoryChange?: () => void;
  onBulkTagChange?: () => void;
  onBulkArchive?: () => void;
  onBulkDelete?: () => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkCategoryChange,
  onBulkTagChange,
  onBulkArchive,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center space-x-4 sm:space-x-6 animate-in slide-in-from-bottom-4 duration-200">
      {/* Selected Counter */}
      <div className="flex items-center space-x-2 text-xs font-medium border-r border-slate-700 pr-4">
        <CheckSquare className="w-4 h-4 text-emerald-400" />
        <span>
          {selectedCount} of {totalCount} selected
        </span>
      </div>

      {/* Bulk Action Buttons */}
      <div className="flex items-center space-x-2 text-xs">
        {onBulkStatusChange && (
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusChange(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9e472a]"
            >
              <option value="" disabled>Set Status...</option>
              <option value="ACTIVE">Set Active</option>
              <option value="DRAFT">Set Draft</option>
              <option value="ARCHIVED">Set Archived</option>
            </select>
          </div>
        )}

        {onBulkCategoryChange && (
          <button
            onClick={onBulkCategoryChange}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Category</span>
          </button>
        )}

        {onBulkTagChange && (
          <button
            onClick={onBulkTagChange}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Tags</span>
          </button>
        )}

        {onBulkArchive && (
          <button
            onClick={onBulkArchive}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs text-amber-300 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </button>
        )}

        {onBulkDelete && (
          <button
            onClick={onBulkDelete}
            className="flex items-center space-x-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      {/* Clear Selection X */}
      <button
        onClick={onClearSelection}
        className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
