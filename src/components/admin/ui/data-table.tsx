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

export interface DataTableProps<T extends { id: string }> {
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
  mobileCardRender?: (
    item: T,
    isSelected: boolean,
    toggleSelect: (e: React.SyntheticEvent) => void
  ) => React.ReactNode;
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
  mobileCardRender,
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

  const toggleSelectRow = (id: string, e: React.SyntheticEvent) => {
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col w-full">
      {/* Top Filter & Search Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col gap-3 bg-slate-50/50">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Filter Tabs if provided */}
        {filterTabs && onFilterChange && (
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onFilterChange(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                  activeFilter === tab.value
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeFilter === tab.value
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── DESKTOP VIEW: Full HTML Table (Hidden on Mobile < md) ─── */}
      <div className="hidden md:block overflow-x-auto w-full">
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
                        onChange={(e) => toggleSelectRow(item.id, e)}
                        className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 px-4 ${col.className || ""}`}
                      >
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

      {/* ─── MOBILE VIEW: Native App Card/List View (Visible on Mobile < md) ─── */}
      <div className="block md:hidden divide-y divide-slate-100 w-full">
        {paginatedData.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 space-y-2">
            <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="font-semibold text-slate-800 text-sm">No records found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          paginatedData.map((item) => {
            const isSelected = selectedIds.has(item.id);

            // Custom Mobile Card Render if provided by page
            if (mobileCardRender) {
              return (
                <div
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`p-4 transition-colors active:bg-slate-50 ${
                    isSelected ? "bg-slate-50" : "bg-white"
                  } ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {mobileCardRender(item, isSelected, (e) =>
                    toggleSelectRow(item.id, e)
                  )}
                </div>
              );
            }

            // Default Mobile Card Fallback
            return (
              <div
                key={item.id}
                onClick={() => onRowClick && onRowClick(item)}
                className={`p-4 transition-colors space-y-3 ${
                  isSelected ? "bg-slate-50" : "bg-white"
                } ${onRowClick ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => toggleSelectRow(item.id, e)}
                      className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
                    />
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {columns[0]
                        ? columns[0].cell
                          ? columns[0].cell(item)
                          : String((item as unknown as Record<string, unknown>)[columns[0].key] ?? "")
                        : null}
                    </div>
                  </div>

                  {columns[1] && (
                    <div className="shrink-0">
                      {columns[1].cell
                        ? columns[1].cell(item)
                        : String((item as unknown as Record<string, unknown>)[columns[1].key] ?? "")}
                    </div>
                  )}
                </div>

                {/* Secondary columns */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100/80">
                  {columns.slice(2).map((col) => (
                    <div key={col.key} className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block truncate">
                        {col.header}
                      </span>
                      <div className="text-slate-800 font-medium truncate">
                        {col.cell
                          ? col.cell(item)
                          : String((item as unknown as Record<string, unknown>)[col.key] ?? "")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="text-xs text-slate-500 font-mono order-2 sm:order-1 text-center sm:text-left">
          Showing{" "}
          <strong className="text-slate-800">
            {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-800">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </strong>{" "}
          of <strong className="text-slate-800">{sortedData.length}</strong> entries
        </div>

        <div className="flex items-center space-x-1.5 order-1 sm:order-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1 shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="text-xs font-mono font-medium text-slate-700 px-2">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1 shadow-2xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={paginatedData.length}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkStatusChange={
            onBulkStatusChange
              ? (status: string) => onBulkStatusChange(Array.from(selectedIds), status)
              : undefined
          }
          onBulkDelete={
            onBulkDelete ? () => onBulkDelete(Array.from(selectedIds)) : undefined
          }
          onBulkArchive={
            onBulkArchive ? () => onBulkArchive(Array.from(selectedIds)) : undefined
          }
        />
      )}
    </div>
  );
}

export const ResponsiveDataView = DataTable;
