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
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: "3" },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Content (CMS)", href: "/admin/content/homepage", icon: LayoutTemplate },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { label: "Discounts", href: "/admin/discounts", icon: Percent },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Media (R2)", href: "/admin/media", icon: ImageIcon },
  { label: "Audit & Settings", href: "/admin/settings/audit-logs", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 flex-shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-serif-editorial text-lg text-white tracking-widest font-medium uppercase">
              RUST <span className="text-[#9e472a]">&amp;</span> REVIVE
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
              <span>COMMERCE ADMIN</span>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Open Live Storefront"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Primary Navigation List */}
        <nav className="p-3 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#9e472a] text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Snippet */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white">
            SH
          </div>
          <div className="text-xs">
            <div className="font-medium text-white">Shakhwat H.</div>
            <div className="text-[10px] font-mono text-emerald-400">SUPER_ADMIN</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
