"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  LayoutTemplate,
  Sliders,
  ArrowRight,
  X,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  category: "Products" | "Orders" | "Customers" | "Content" | "Settings";
  subtitle?: string;
  href: string;
  icon: React.ElementType;
}

const SEARCH_DATABASE: SearchItem[] = [
  // Products
  { id: "p1", title: "Wide Leg Pleated Sweatpants", category: "Products", subtitle: "SKU: RR-PNT-001 • ৳6,960", href: "/admin/products", icon: Package },
  { id: "p2", title: "FB Sister Unisex Baggy Raw Denim", category: "Products", subtitle: "SKU: RR-DNM-002 • ৳10,560", href: "/admin/products", icon: Package },
  { id: "p3", title: "Vintage Washed Leather Aviator Jacket", category: "Products", subtitle: "SKU: RR-JKT-003 • ৳22,200", href: "/admin/products", icon: Package },
  { id: "p4", title: "280GSM Heavyweight Boxy Cut Tee", category: "Products", subtitle: "SKU: RR-TEE-004 • ৳4,560", href: "/admin/products", icon: Package },
  // Content / CMS
  { id: "c1", title: "Homepage CMS Studio", category: "Content", subtitle: "Hero slides, section ordering, text & CTAs", href: "/admin/content/homepage", icon: LayoutTemplate },
  { id: "c2", title: "Hero Carousel Manager", category: "Content", subtitle: "Edit 35mm campaign slides and buttons", href: "/admin/content/homepage", icon: LayoutTemplate },
  { id: "c3", title: "Media Library (Cloudflare R2)", category: "Content", subtitle: "Direct image uploads & CDN assets", href: "/admin/media", icon: LayoutTemplate },
  // Orders
  { id: "o1", title: "Order #RR-1025", category: "Orders", subtitle: "Tanvir Ahmed • ৳17,520 • Paid / Shipped", href: "/admin/orders", icon: ShoppingCart },
  { id: "o2", title: "Order #RR-1024", category: "Orders", subtitle: "Nafis Fuad • ৳4,560 • Cash on Delivery", href: "/admin/orders", icon: ShoppingCart },
  // Customers
  { id: "cu1", title: "Tanvir Ahmed", category: "Customers", subtitle: "tanvir@example.com • 3 orders", href: "/admin/customers", icon: Users },
  { id: "cu2", title: "Zarin Tasnim", category: "Customers", subtitle: "zarin@example.com • 5 orders", href: "/admin/customers", icon: Users },
  // Settings
  { id: "s1", title: "Audit Logs & Security", category: "Settings", subtitle: "View staff activity, price edits, role changes", href: "/admin/settings/audit-logs", icon: Sliders },
];

export function GlobalAdminSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  const filteredResults = SEARCH_DATABASE.filter((item) => {
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  }).slice(0, 8);

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  };

  return (
    <>
      {/* Search Input Trigger in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/70 text-slate-500 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-48 sm:w-64"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search admin...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] rounded-md font-mono text-slate-400">
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
              <Search className="w-4 h-4 text-slate-400 mr-2.5 ml-1" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type to search products, orders, customers, or CMS..."
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
              {filteredResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching admin records found for &quot;{query}&quot;
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-slate-50 text-slate-900" : "text-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">
                          {item.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
              <span>Navigate with arrow keys</span>
              <span>
                Press <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded-xs">ESC</kbd> to exit
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
