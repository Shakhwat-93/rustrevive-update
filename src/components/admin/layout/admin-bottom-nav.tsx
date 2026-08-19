"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Menu,
} from "lucide-react";

interface AdminBottomNavProps {
  onOpenMenu: () => void;
}

export function AdminBottomNav({ onOpenMenu }: AdminBottomNavProps) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  ];

  const isMoreActive =
    !NAV_ITEMS.some((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile Admin Navigation"
    >
      <div className="grid grid-cols-5 h-14 items-center max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full transition-colors relative ${
                isActive ? "text-[#9e472a]" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-[2px] bg-[#9e472a] rounded-full" />
              )}
              <Icon className="w-4 h-4 stroke-[2]" />
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                  isActive ? "font-bold" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center h-full transition-colors relative cursor-pointer ${
            isMoreActive ? "text-[#9e472a]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {isMoreActive && (
            <span className="absolute top-0 w-8 h-[2px] bg-[#9e472a] rounded-full" />
          )}
          <Menu className="w-4 h-4 stroke-[2]" />
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 ${
              isMoreActive ? "font-bold" : ""
            }`}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
