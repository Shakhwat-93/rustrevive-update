"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  LayoutTemplate,
  Megaphone,
  Percent,
  BarChart3,
  Image as ImageIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: "3" },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Fulfillment", href: "/admin/fulfillment", icon: Megaphone },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Content", href: "/admin/content/homepage", icon: LayoutTemplate },
  { label: "Discounts", href: "/admin/discounts", icon: Percent },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Media", href: "/admin/media", icon: ImageIcon },
  { label: "Shipping Rates", href: "/admin/settings/shipping", icon: Settings },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-all duration-300 ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-[68px]" : "lg:w-64"}`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
            {!isCollapsed ? (
              <div className="space-y-0.5">
                <div className="font-serif-editorial text-base text-white tracking-widest font-semibold uppercase">
                  RUST <span className="text-[#9e472a]">&amp;</span> REVIVE
                </div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  COMMERCE ADMIN
                </div>
              </div>
            ) : (
              <div className="mx-auto font-serif-editorial text-base text-[#9e472a] font-bold">
                R&amp;R
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-1 overflow-y-auto">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center ${
                    isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                  } rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#9e472a] text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator Bar */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/40 rounded-r" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Profile */}
        <div className="p-3 border-t border-slate-800">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                SH
              </div>
              {!isCollapsed && (
                <div className="text-xs">
                  <div className="font-medium text-white line-clamp-1">Shakhwat H.</div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                    SUPER ADMIN
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => alert("Logged out")}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
