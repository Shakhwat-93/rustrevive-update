"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, Bell, Sparkles } from "lucide-react";
import { GlobalAdminSearch } from "@/components/admin/search/global-admin-search";

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    if (pathname === "/admin") return "Overview";
    if (pathname.startsWith("/admin/products/new")) return "Products / New Product";
    if (pathname.startsWith("/admin/products")) return "Products";
    if (pathname.startsWith("/admin/content/homepage")) return "Content / Homepage CMS";
    if (pathname.startsWith("/admin/media")) return "Media Library";
    if (pathname.startsWith("/admin/orders")) return "Orders";
    if (pathname.startsWith("/admin/inventory")) return "Inventory";
    if (pathname.startsWith("/admin/customers")) return "Customers";
    if (pathname.startsWith("/admin/marketing")) return "Marketing";
    if (pathname.startsWith("/admin/discounts")) return "Discounts";
    if (pathname.startsWith("/admin/analytics")) return "Analytics";
    if (pathname.startsWith("/admin/settings/audit-logs")) return "Settings / Audit Logs";
    return "Admin";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Rust &amp; Revive</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-800">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Center/Right: Omnibox Global Search & Fast Utilities */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <GlobalAdminSearch />

        {/* Live Storefront Link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#9e472a]" />
          <span>Live Store</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* Notifications Icon */}
        <button
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#9e472a] rounded-full" />
        </button>

        {/* Staff Mini Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold select-none cursor-pointer">
          SH
        </div>
      </div>
    </header>
  );
}
