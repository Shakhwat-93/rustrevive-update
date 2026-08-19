"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Heart,
  Shield,
  User,
  LogOut,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

interface Profile {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}

interface AccountOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/orders"),
      ]);

      if (profileRes.status === 401) {
        router.push("/login?redirect=/account");
        return;
      }

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();

      if (profileData?.data) {
        setProfile(profileData.data.profile);
        setEmail(profileData.data.email ?? "");
      }
      if (ordersData?.data) {
        setOrders(ordersData.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load account data:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = profile?.display_name
    || (profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : null)
    || email?.split("@")[0]
    || "Patron";

  const accountLinks = [
    { icon: Package, label: "Order History", desc: `${orders.length > 0 ? orders.length : "No"} recent orders`, href: "/account/orders" },
    { icon: MapPin, label: "Saved Addresses", desc: "Manage delivery destinations", href: "/account/addresses" },
    { icon: Heart, label: "Wishlist", desc: "Your saved pieces", href: "/account/wishlist" },
    { icon: User, label: "Profile", desc: "Update personal details", href: "/account/profile" },
    { icon: Shield, label: "Security", desc: "Password & connected accounts", href: "/account/security" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
                Patron Account
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
                {loading ? "..." : `Welcome, ${displayName}`}
              </h1>
              <p className="text-xs font-sans text-[#8c8577]">{email}</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center space-x-1.5 text-xs font-mono text-[#8c8577] hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>

          {/* Account Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-white border border-[#e8e2d5] p-5 shadow-xs hover:border-[#9e472a] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <Icon className="w-5 h-5 text-[#9e472a] stroke-[1.5]" />
                    <ChevronRight className="w-4 h-4 text-[#c8c0b3] group-hover:text-[#9e472a] transition-colors" />
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#141312]">
                      {link.label}
                    </p>
                    <p className="text-[11px] font-sans text-[#8c8577]">{link.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recent Orders Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312]">
                Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="text-xs font-mono text-[#9e472a] hover:underline flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white border border-[#e8e2d5] p-6 text-center text-xs font-mono text-[#8c8577]">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-[#e8e2d5] p-8 text-center space-y-4 shadow-xs">
                <Package className="w-8 h-8 text-[#9e472a] mx-auto stroke-[1.2]" />
                <div>
                  <h3 className="font-serif text-base uppercase tracking-wider text-[#141312]">No Orders Yet</h3>
                  <p className="text-xs font-sans text-[#5c574e] mt-1 max-w-xs mx-auto">
                    Your order history will appear here after your first purchase.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-block px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#e8e2d5] shadow-xs divide-y divide-[#f0ebe1]">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders`}
                    className="flex items-center justify-between p-4 hover:bg-[#faf8f4] transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono font-semibold text-[#141312]">{order.order_number}</p>
                      <p className="text-[11px] font-sans text-[#8c8577]">
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${STATUS_COLORS[order.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {order.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#141312]">
                        ৳{order.grand_total.toLocaleString()}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#c8c0b3] group-hover:text-[#9e472a] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
