"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { AdminHeader } from "@/components/admin/layout/admin-header";
import { AdminDialogProvider } from "@/context/admin-dialog-context";
import { AdminRealtimeProvider } from "@/context/admin-realtime-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <AdminDialogProvider>
      <AdminRealtimeProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col lg:flex-row overflow-x-hidden">
          {/* Persistent / Collapsible Sidebar & Mobile Drawer */}
          <AdminSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />

          {/* Main Content Area */}
          <div
            className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
              isCollapsed ? "lg:pl-[68px]" : "lg:pl-64"
            }`}
          >
            <AdminHeader onOpenMobileMenu={() => setIsMobileOpen(true)} />
            <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </AdminRealtimeProvider>
    </AdminDialogProvider>
  );
}
