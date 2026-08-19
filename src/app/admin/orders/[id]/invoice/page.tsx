import React from "react";
import { notFound } from "next/navigation";
import { OrderService } from "@/lib/services/order.service";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderInvoicePage(props: PageProps) {
  const { id } = await props.params;

  let order;
  try {
    order = await OrderService.getOrderById(id);
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

  const items = order.order_items || [];

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 border border-slate-200 shadow-sm print:shadow-none print:border-none">
        {/* Action Header for Screen Only */}
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-100 print:hidden">
          <span className="text-xs font-mono text-slate-500">Official Commercial Tax Invoice</span>
          <PrintButton />
        </div>

        {/* Invoice Official Brand Header */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-serif tracking-[0.2em] font-bold text-slate-900 uppercase">
              RUST & REVIVE
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Refined Heritage & Artisanal Essentials
            </p>
            <p className="text-xs font-mono text-slate-600 mt-2">
              Dhaka, Bangladesh • contact@rustrevive.store
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
              INVOICE
            </span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-2">{order.order_number}</p>
            <p className="text-xs font-mono text-slate-500">
              Date: {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Customer & Billing/Shipping Destination */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs font-mono">
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Billed & Shipped To:</h3>
            <p className="font-semibold text-slate-800">{shippingAddr.fullName}</p>
            <p className="text-slate-600">{shippingAddr.phone}</p>
            <p className="text-slate-600">{shippingAddr.addressLine1}</p>
            {shippingAddr.addressLine2 && <p className="text-slate-600">{shippingAddr.addressLine2}</p>}
            <p className="text-slate-600">
              {shippingAddr.city} {shippingAddr.area ? `, ${shippingAddr.area}` : ""}{" "}
              {shippingAddr.postalCode ? ` - ${shippingAddr.postalCode}` : ""}
            </p>
            <p className="text-slate-600">Bangladesh</p>
          </div>

          <div className="text-right space-y-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Terms:</h3>
            <p className="text-slate-600">
              Method: <span className="font-semibold text-slate-900">{order.payment_method === "CASH_ON_DELIVERY" ? "Cash on Delivery (COD)" : order.payment_method}</span>
            </p>
            <p className="text-slate-600">
              Status: <span className="font-semibold text-slate-900">{order.payment_status}</span>
            </p>
            <p className="text-slate-600">
              Currency: <span className="font-semibold text-slate-900">BDT (৳)</span>
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider">
                <th className="py-2">Item Description</th>
                <th className="py-2">SKU</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="font-semibold text-slate-900">{item.product_title_snapshot}</p>
                    {item.variant_title_snapshot && (
                      <p className="text-[10px] text-slate-500">{item.variant_title_snapshot}</p>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{item.sku_snapshot}</td>
                  <td className="py-3 text-right text-slate-800">৳{item.unit_price.toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-800">{item.quantity}</td>
                  <td className="py-3 text-right font-semibold text-slate-900">৳{item.line_total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown */}
        <div className="flex justify-end py-6 text-xs font-mono">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>৳{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>৳{order.shipping_total.toLocaleString()}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>-৳{order.discount_total.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span>৳{order.grand_total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Guarantee */}
        <div className="border-t border-slate-200 pt-6 text-center text-[10px] font-mono text-slate-400">
          <p>Thank you for choosing Rust & Revive. Crafted with uncompromising attention to detail.</p>
          <p className="mt-1">For any queries regarding this invoice, please reach out to care@rustrevive.store</p>
        </div>
      </div>
    </div>
  );
}
