"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  User,
  Phone,
  Mail,
  Send,
  Loader2,
  Printer,
  Truck,
  Package,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { useAdminRealtime } from "@/context/admin-realtime-context";
import { VALID_STATUS_TRANSITIONS } from "@/lib/constants/order.constants";
import type { OrderStatus, PaymentStatus, DeliveryStatus } from "@/types/database.types";

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  notes: string | null;
  customer_notes: string | null;
  shipping_address_snapshot: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    area?: string;
    postalCode?: string;
  };
  fulfillments?: {
    id: string;
    tracking_number: string;
    status: DeliveryStatus;
    courier_notes: string | null;
    created_at: string;
  }[];
  order_items: {
    id: string;
    product_title_snapshot: string;
    variant_title_snapshot: string | null;
    sku_snapshot: string;
    image_url_snapshot: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  order_events: {
    id: string;
    event_type: string;
    old_status: string | null;
    new_status: string | null;
    message: string;
    created_by: string;
    created_at: string;
  }[];
  created_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage(props: PageProps) {
  const resolvedParams = use(props.params);
  const orderId = resolvedParams.id;
  const { onOrderUpdate } = useAdminRealtime();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("CUSTOM");
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data?.data) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime synchronization for this order
  useEffect(() => {
    const unsubscribe = onOrderUpdate((updated) => {
      if (updated.id === orderId) {
        fetchOrder();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, onOrderUpdate, fetchOrder]);

  const { showToast, confirm } = useAdminDialog();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    const isDanger = newStatus === "CANCELLED";
    const ok = await confirm({
      title: `Transition Order to ${newStatus.replace(/_/g, " ")}?`,
      message: `This will update the order status in real-time, log the event to the timeline, and notify the customer if configured.`,
      confirmText: `Mark ${newStatus.replace(/_/g, " ")}`,
      variant: isDanger ? "danger" : "primary",
    });

    if (!ok) return;

    try {
      setMutating(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          status: newStatus,
          actorName: "Admin Staff",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData?.error?.message || "Failed to update status.", "error");
      } else {
        showToast(`Order status updated to ${newStatus.replace(/_/g, " ")}`, "success");
        await fetchOrder();
      }
    } catch {
      showToast("Error updating order status.", "error");
    } finally {
      setMutating(false);
    }
  };

  const handleCreateShipment = async () => {
    try {
      setCreatingShipment(true);
      const res = await fetch("/api/admin/fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          courierCode: selectedCourier,
          actorName: "Admin Staff",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json?.error?.message || "Failed to create shipment.", "error");
      } else {
        showToast(`Shipment created successfully! Tracking: ${json.data.tracking_number}`, "success");
        await fetchOrder();
      }
    } catch {
      showToast("Error creating consignment shipment.", "error");
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_note",
          note: noteText.trim(),
          actorName: "Admin Staff",
        }),
      });

      if (res.ok) {
        setNoteText("");
        await fetchOrder();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading || !order) {
    return (
      <AdminPageLayout title="Order Details" subtitle="Loading order details...">
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      </AdminPageLayout>
    );
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
  const latestFulfillment = order.fulfillments && order.fulfillments.length > 0 ? order.fulfillments[0] : null;

  return (
    <AdminPageLayout
      title={`Order ${order.order_number}`}
      subtitle={`Placed on ${new Date(order.created_at).toLocaleString()} • Customer: ${order.customer_name}`}
      actions={
        <div className="flex items-center space-x-2">
          {/* Invoice Print Link */}
          <Link
            href={`/admin/orders/${orderId}/invoice`}
            className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-mono rounded hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </Link>

          {allowedTransitions.map((targetStatus) => {
            const isDanger = targetStatus === "CANCELLED";
            return (
              <AdminButton
                key={targetStatus}
                variant={isDanger ? "danger" : "primary"}
                size="sm"
                isLoading={mutating}
                onClick={() => handleStatusChange(targetStatus)}
              >
                Mark {targetStatus.replace(/_/g, " ")}
              </AdminButton>
            );
          })}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Items, Destination & Financial Ledger (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Items Card */}
          <AdminCard title={`Purchased Items (${order.order_items.length})`}>
            <div className="divide-y divide-slate-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-14 sm:w-14 sm:h-16 bg-slate-50 border border-slate-200 relative overflow-hidden rounded-lg flex-shrink-0">
                      {item.image_url_snapshot ? (
                        <Image
                          src={item.image_url_snapshot}
                          alt={item.product_title_snapshot}
                          fill
                          className="object-cover"
                          sizes="60px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-mono">
                          NO IMG
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {item.product_title_snapshot}
                      </h4>
                      {item.variant_title_snapshot && (
                        <p className="text-[11px] font-mono text-slate-500">
                          {item.variant_title_snapshot}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        SKU: {item.sku_snapshot} • ৳{item.unit_price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[11px] font-mono text-slate-400 sm:hidden">Line Total:</span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ৳{item.line_total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Ledger Subtotal */}
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>৳{order.shipping_total.toLocaleString()}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-৳{order.discount_total.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-amber-800">৳{order.grand_total.toLocaleString()}</span>
              </div>
            </div>
          </AdminCard>

          {/* Audit Timeline */}
          <AdminCard title="Order Audit Timeline">
            <div className="space-y-4">
              {order.order_events?.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 border-b border-slate-100 pb-3 last:border-0">
                    <p className="font-medium text-slate-800">{event.message}</p>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span>By {event.created_by}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        {/* RIGHT COLUMN: Fulfillment Actions, Customer & Notes (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fulfillment Action / Status Card */}
          <AdminCard title="Fulfillment & Logistics">
            {latestFulfillment ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Logistics Status:</span>
                  <StatusBadge status={latestFulfillment.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tracking Code:</span>
                  <span className="font-bold text-slate-900">{latestFulfillment.tracking_number}</span>
                </div>
                {latestFulfillment.courier_notes && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                    {latestFulfillment.courier_notes}
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href={`/track-order`}
                    target="_blank"
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 rounded transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Open Public Tracker</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-mono">
                <p className="text-slate-600">
                  Select courier partner to create consignment and generate tracking reference:
                </p>

                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono outline-none"
                >
                  <option value="CUSTOM">Custom In-House Logistics</option>
                  <option value="STEADFAST">Steadfast Courier</option>
                  <option value="PATHAO">Pathao Logistics</option>
                  <option value="REDX">RedX Express</option>
                </select>

                <AdminButton
                  variant="primary"
                  icon={Package}
                  isLoading={creatingShipment}
                  onClick={handleCreateShipment}
                  className="w-full"
                >
                  Create Shipment
                </AdminButton>
              </div>
            )}
          </AdminCard>

          {/* Customer & Destination */}
          <AdminCard title="Customer Destination">
            <div className="space-y-3 text-xs font-mono text-slate-600">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{order.customer_email}</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Shipping Address:</span>
                </p>
                <p className="text-slate-600 pl-5">
                  {order.shipping_address_snapshot?.addressLine1}
                </p>
                {order.shipping_address_snapshot?.addressLine2 && (
                  <p className="text-slate-600 pl-5">
                    {order.shipping_address_snapshot.addressLine2}
                  </p>
                )}
                <p className="text-slate-600 pl-5">
                  {order.shipping_address_snapshot?.city}{" "}
                  {order.shipping_address_snapshot?.area ? `, ${order.shipping_address_snapshot.area}` : ""}{" "}
                  {order.shipping_address_snapshot?.postalCode ? ` - ${order.shipping_address_snapshot.postalCode}` : ""}
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Internal Staff Notes */}
          <AdminCard title="Internal Staff Notes">
            <div className="space-y-3">
              {order.notes ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono whitespace-pre-line text-slate-700 max-h-48 overflow-y-auto">
                  {order.notes}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-400 italic">No internal notes added.</p>
              )}

              <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                <textarea
                  rows={2}
                  placeholder="Add operational staff note (private)..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-2 text-xs font-mono border border-slate-200 rounded focus:border-slate-800 outline-none resize-none"
                />
                <AdminButton
                  type="submit"
                  size="sm"
                  variant="secondary"
                  icon={Send}
                  isLoading={addingNote}
                >
                  Save Note
                </AdminButton>
              </form>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageLayout>
  );
}
