"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

interface AccountOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  created_at: string;
  shipping_address_snapshot?: {
    full_name?: string;
    city?: string;
  } | null;
  shipping_address?: {
    full_name?: string;
    city?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  READY_TO_SHIP: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAY_COLORS: Record<string, string> = {
  COD_PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/orders");
      const data = await res.json();
      if (data?.data) setOrders(data.data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="space-y-1 pt-4">
            <Link
              href="/account"
              className="inline-flex items-center space-x-1 text-xs font-mono text-[#8c8577] hover:text-[#141312] transition-colors mb-4"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Account</span>
            </Link>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold block">
              Consignment Ledger
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Order History
            </h1>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="bg-white border border-[#e8e2d5] p-8 text-center text-xs font-mono text-[#8c8577]">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#ded7c8] p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <Package className="w-8 h-8 text-[#9e472a] mx-auto" />
              <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                No past orders recorded
              </h3>
              <p className="text-xs font-sans-ui text-[#5c574e] max-w-sm mx-auto">
                If you placed an order as a guest, you can look up its live delivery status on our tracking portal.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/track-order"
                  className="px-6 py-2.5 bg-white border border-[#141312] text-xs font-mono uppercase tracking-wider text-[#141312] hover:bg-[#141312] hover:text-[#fbf9f5] transition-colors"
                >
                  Track Guest Order
                </Link>
                <Link
                  href="/shop"
                  className="px-6 py-2.5 bg-[#141312] text-[#fbf9f5] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#9e472a] transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e8e2d5] shadow-xs divide-y divide-[#f0ebe1]">
              {orders.map((order) => (
                <div key={order.id} className="p-5 space-y-3">
                  {/* Row 1: Order Number + Date */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono font-bold text-[#141312]">{order.order_number}</p>
                    <p className="text-[11px] font-sans text-[#8c8577]">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Row 2: Status badges */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${STATUS_COLORS[order.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${PAY_COLORS[order.payment_status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {order.payment_status.replace(/_/g, " ")}
                    </span>
                    {(order.shipping_address_snapshot?.city || order.shipping_address?.city) && (
                      <span className="text-[10px] font-sans text-[#8c8577]">
                        → {order.shipping_address_snapshot?.city || order.shipping_address?.city}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Price breakdown + Track CTA */}
                  <div className="flex items-end justify-between pt-1">
                    <div className="text-[11px] font-mono text-[#8c8577] space-y-0.5">
                      <p>Subtotal: ৳{order.subtotal.toLocaleString()}</p>
                      {order.shipping_total > 0 && <p>Shipping: ৳{order.shipping_total.toLocaleString()}</p>}
                      {order.discount_total > 0 && <p>Discount: -৳{order.discount_total.toLocaleString()}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-[#141312]">
                        ৳{order.grand_total.toLocaleString()}
                      </p>
                      <Link
                        href={`/track-order?order=${order.order_number}`}
                        className="inline-flex items-center space-x-1 text-[11px] font-mono text-[#9e472a] hover:underline mt-1"
                      >
                        <span>Track Order</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
