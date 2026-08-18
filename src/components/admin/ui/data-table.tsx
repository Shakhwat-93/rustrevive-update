"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { BulkActionBar } from "@/components/admin/ui/bulk-action-bar";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  onBulkStatusChange?: (selectedIds: string[], status: string) => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  onBulkArchive?: (selectedIds: string[]) => void;
  filterTabs?: { label: string; value: string; count?: number }[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKey,
  pageSize = 10,
  onRowClick,
  onBulkStatusChange,
  onBulkDelete,
  onBulkArchive,
  filterTabs,
  activeFilter,
  onFilterChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!searchQuery) return true;
      if (searchKey) {
        const val = item[searchKey];
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      }
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery, searchKey]);

  // Sorted Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortKey];
      const bVal = (b as unknown as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection Logic
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedData.forEach((item) => next.delete(item.id));
    } else {
      paginatedData.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        {/* Filter Tabs if provided */}
        {filterTabs && onFilterChange && (
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onFilterChange(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeFilter === tab.value
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 text-xs rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-medium text-[11px] tracking-wider">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allCurrentPageSelected}
                  onChange={toggleSelectAll}
                  className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 ${col.className || ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center space-x-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 text-center text-slate-500 space-y-1"
                >
                  <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="font-medium text-slate-700">No records found</p>
                  <p className="text-[11px] text-slate-400">
                    Try adjusting your filters or search terms.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? "bg-slate-50" : ""
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    <td
                      className="py-3 px-4 w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(item.id, e as unknown as React.MouseEvent)}
                        className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3 px-4 ${col.className || ""}`}>
                        {col.cell
                          ? col.cell(item)
                          : String(
                              (item as unknown as Record<string, unknown>)[col.key] ?? ""
                            )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing{" "}
          <span className="font-medium text-slate-800">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-800">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{" "}
          of <span className="font-medium text-slate-800">{sortedData.length}</span>{" "}
          results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-700 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={data.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatusChange={(status) =>
          onBulkStatusChange && onBulkStatusChange(Array.from(selectedIds), status)
        }
        onBulkDelete={() =>
          onBulkDelete && onBulkDelete(Array.from(selectedIds))
        }
        onBulkArchive={() =>
          onBulkArchive && onBulkArchive(Array.from(selectedIds))
        }
      />
    </div>
  );
}
