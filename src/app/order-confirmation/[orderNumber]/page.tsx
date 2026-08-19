import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Truck,
  Banknote,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { OrderService } from "@/lib/services/order.service";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

interface OrderItemRow {
  id: string;
  product_title_snapshot: string;
  variant_title_snapshot: string | null;
  sku_snapshot: string;
  image_url_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export default async function OrderConfirmationPage(props: PageProps) {
  const { orderNumber } = await props.params;

  let order;
  try {
    order = await OrderService.getOrderByNumber(orderNumber);
  } catch {
    notFound();
  }

  const shippingAddr = order.shipping_address_snapshot as unknown as {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    area?: string;
    postalCode?: string;
  };

  const items = (order.order_items || []) as unknown as OrderItemRow[];

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#141312] pt-24 pb-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-3xl mx-auto">
        {/* Header Hero */}
        <div className="bg-white border border-[#ded7c8] p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif uppercase tracking-wider text-[#141312] mt-1">
              Thank You, {order.customer_name}
            </h1>
            <p className="text-xs font-mono text-[#6E6B63] mt-2">
              Your order has been recorded and will be prepared for dispatch shortly.
            </p>
          </div>

          {/* Human Order Number Badge */}
          <div className="inline-flex items-center space-x-3 bg-[#faf6f0] border border-[#d5cfc2] px-5 py-2.5">
            <span className="text-xs font-mono text-[#6E6B63] uppercase tracking-wider">
              Order Reference:
            </span>
            <span className="text-sm font-mono font-bold text-[#9e472a]">
              {order.order_number}
            </span>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="mt-8 bg-white border border-[#ded7c8] p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Status Tracker */}
          <div className="border-b border-[#f0ebe1] pb-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] mb-4">
              Fulfillment Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#faf6f0] border border-[#e8e2d5] flex items-center space-x-3">
                <Clock className="w-4 h-4 text-[#9e472a]" />
                <div>
                  <span className="text-[10px] text-[#8E8B82] uppercase">Status</span>
                  <p className="font-semibold text-[#141312]">{order.status}</p>
                </div>
              </div>

              <div className="p-3 bg-[#faf6f0] border border-[#e8e2d5] flex items-center space-x-3">
                <Banknote className="w-4 h-4 text-[#9e472a]" />
                <div>
                  <span className="text-[10px] text-[#8E8B82] uppercase">Payment</span>
                  <p className="font-semibold text-[#141312]">
                    {order.payment_status === "COD_PENDING" ? "COD (Unpaid)" : order.payment_status}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#faf6f0] border border-[#e8e2d5] flex items-center space-x-3">
                <Truck className="w-4 h-4 text-[#9e472a]" />
                <div>
                  <span className="text-[10px] text-[#8E8B82] uppercase">Fulfillment</span>
                  <p className="font-semibold text-[#141312]">{order.fulfillment_status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchased Items Snapshots */}
          <div className="border-b border-[#f0ebe1] pb-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#141312] mb-4">
              Ordered Items ({items.length})
            </h3>
            <div className="divide-y divide-[#f0ebe1]">
              {items.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-16 bg-[#f7f5f0] border border-[#e8e2d5] relative overflow-hidden flex-shrink-0">
                      {item.image_url_snapshot ? (
                        <Image
                          src={item.image_url_snapshot}
                          alt={item.product_title_snapshot}
                          fill
                          className="object-cover"
                          sizes="60px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E8B82] text-[9px] font-mono">
                          R&R
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-serif uppercase tracking-wider text-[#141312]">
                        {item.product_title_snapshot}
                      </h4>
                      {item.variant_title_snapshot && (
                        <p className="text-[10px] font-mono text-[#8E8B82]">
                          {item.variant_title_snapshot}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-[#6E6B63] mt-0.5">
                        SKU: {item.sku_snapshot} • Qty: {item.quantity} × ৳{item.unit_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-mono font-semibold text-[#141312]">
                    ৳{item.line_total.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Destination & Payment Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-[#f0ebe1] pb-6">
            {/* Delivery Destination */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider font-semibold text-[#141312]">
                <MapPin className="w-3.5 h-3.5 text-[#9e472a]" />
                <span>Delivery Address</span>
              </div>
              <div className="text-xs font-mono text-[#6E6B63] space-y-0.5 pl-5">
                <p className="font-semibold text-[#141312]">{shippingAddr.fullName}</p>
                <p>{shippingAddr.phone}</p>
                <p>{shippingAddr.addressLine1}</p>
                {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                <p>
                  {shippingAddr.city} {shippingAddr.area ? `, ${shippingAddr.area}` : ""}{" "}
                  {shippingAddr.postalCode ? ` - ${shippingAddr.postalCode}` : ""}
                </p>
                <p>Bangladesh</p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center space-x-2 uppercase tracking-wider font-semibold text-[#141312] mb-3">
                <Banknote className="w-3.5 h-3.5 text-[#9e472a]" />
                <span>Financial Ledger</span>
              </div>

              <div className="flex justify-between text-[#6E6B63]">
                <span>Subtotal</span>
                <span className="text-[#141312]">৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#6E6B63]">
                <span>Shipping</span>
                <span className="text-[#141312]">৳{order.shipping_total.toLocaleString()}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-৳{order.discount_total.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-[#141312] pt-2 flex justify-between text-sm font-bold text-[#141312]">
                <span>Total Payable (COD)</span>
                <span className="text-[#9e472a]">৳{order.grand_total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-[#8E8B82]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>A confirmation dispatch has been logged in our secure ledger.</span>
            </div>

            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#141312] text-[#fbf9f5] font-mono text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center space-x-2 hover:bg-[#9e472a] transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
