"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  LayoutTemplate,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  category: "Products" | "Orders" | "Customers" | "Navigation";
  subtitle: string;
  href: string;
}

export function GlobalAdminSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Dynamic Database Search
  const performSearch = useCallback(async (q: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setResults(json.data.results || []);
      }
    } catch (err) {
      console.error("Search query error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, isOpen, performSearch]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Products":
        return Package;
      case "Orders":
        return ShoppingCart;
      case "Customers":
        return Users;
      default:
        return LayoutTemplate;
    }
  };

  return (
    <>
      {/* Search Input Trigger in Header: Icon button on mobile (<sm), full bar on >=sm */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center sm:justify-start space-x-2 bg-transparent sm:bg-slate-100 hover:bg-slate-100 sm:hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 text-xs p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors cursor-pointer w-9 h-9 sm:w-56 md:w-64 shrink-0"
        aria-label="Search admin (Cmd+K)"
        title="Search admin (Cmd+K)"
      >
        <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
        <span className="hidden sm:inline flex-1 text-left truncate">Search admin...</span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] rounded-md font-mono text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Bar Input */}
            <div className="p-3 border-b border-slate-100 flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 text-slate-400 mr-2.5 ml-1 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 mr-2.5 ml-1" />
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search products, orders, customers, or admin modules..."
                className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
              {results.length === 0 && !loading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {query ? `No matching records found for "${query}"` : "Type to search across store records..."}
                </div>
              ) : (
                results.map((item, idx) => {
                  const Icon = getCategoryIcon(item.category);
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400 truncate font-mono">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {item.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Keybind Info */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Navigate with mouse or keyboard</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                ESC to close
              </kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
