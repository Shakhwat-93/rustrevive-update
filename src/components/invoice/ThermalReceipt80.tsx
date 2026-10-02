import React from "react";
import type { InvoiceData } from "@/types/invoice.types";

interface ThermalReceipt80Props {
  data: InvoiceData;
}

/**
 * EXACT 80mm Thermal Receipt Component
 * Physical Width: 80mm (exact)
 * Height: Dynamic
 * Safe Internal Printable Area: ~70-74mm
 * Independent Multi-Column POS Format
 */
export function ThermalReceipt80({ data }: ThermalReceipt80Props) {
  const { customer, items } = data;

  return (
    <div
      className="thermal-receipt-80 bg-white text-black font-mono text-[12px] leading-[1.35] antialiased select-none"
      style={{
        width: "80mm",
        minWidth: "80mm",
        maxWidth: "80mm",
        boxSizing: "border-box",
        padding: "3mm 4mm",
        margin: "0 auto",
        overflow: "hidden",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {/* Brand Header */}
      <div className="text-center pb-1.5">
        <h1 className="text-[16px] font-bold tracking-[0.15em] uppercase leading-tight">
          {data.brandName}
        </h1>
        <p className="text-[10.5px] uppercase tracking-wide text-black/85 mt-0.5">
          {data.tagline}
        </p>
        <p className="text-[10px] text-black/75 mt-0.5">
          {data.storeAddress} • {data.storeEmail}
        </p>
        <p className="text-[9.5px] text-black/70">
          Official Sales & Tax Receipt
        </p>
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Order Meta - Multi-column layout */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="font-bold">ORDER: </span>
          <span className="font-semibold">{data.orderNumber}</span>
        </div>
        <div className="text-right">
          <span className="font-bold">DATE: </span>
          <span>{data.date}</span>
        </div>
      </div>
      <div className="flex justify-between text-[10.5px] text-black/85 pt-0.5">
        <span>TIME: {data.time}</span>
        <span>STATUS: {data.orderStatus}</span>
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Customer & Shipping Information */}
      <div className="space-y-0.5 text-[11px]">
        <div>
          <span className="font-bold">BILLED/SHIPPED TO:</span>
        </div>
        <div className="font-bold text-[11.5px] text-black">
          {customer.name}
        </div>
        <div>
          <span className="text-black/85">Phone: </span>
          <span className="font-semibold">{customer.phone}</span>
        </div>
        <div className="text-black/90 pt-0.5 leading-snug">
          <span className="text-black/85">Address: </span>
          <span>{customer.fullAddress}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Multi-column Product Table Header */}
      <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-black">
        <div className="col-span-6">ITEM DESCRIPTION</div>
        <div className="col-span-3 text-center">QTY × PRICE</div>
        <div className="col-span-3 text-right">TOTAL</div>
      </div>

      {/* Product Items List */}
      <div className="divide-y divide-dashed divide-black/40 py-1">
        {items.map((item) => (
          <div key={item.id} className="py-1.5">
            <div className="grid grid-cols-12 items-baseline text-[11.5px]">
              <div className="col-span-6 font-bold leading-tight pr-1">
                {item.title}
                {item.variant && (
                  <p className="font-normal text-[10px] text-black/80">
                    {item.variant}
                  </p>
                )}
                {item.sku && (
                  <p className="font-normal text-[9px] text-black/60">
                    SKU: {item.sku}
                  </p>
                )}
              </div>
              <div className="col-span-3 text-center text-[10.5px] text-black/90">
                {item.quantity} × ৳{item.unitPrice.toLocaleString()}
              </div>
              <div className="col-span-3 text-right font-bold text-[11.5px]">
                ৳{item.lineTotal.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Financial Ledger Breakdown */}
      <div className="space-y-1 text-[11.5px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>৳{data.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charge:</span>
          <span>৳{data.shippingTotal.toLocaleString()}</span>
        </div>
        {data.discountTotal > 0 && (
          <div className="flex justify-between font-bold">
            <span>Promotional Discount:</span>
            <span>-৳{data.discountTotal.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Double Line / Heavy Total Amount */}
      <div className="border-t-2 border-b-2 border-black my-1.5 py-1.5">
        <div className="flex justify-between items-baseline font-bold text-[14.5px]">
          <span>GRAND TOTAL:</span>
          <span>৳{data.grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Details & Notes */}
      <div className="space-y-1 text-[11px] pt-0.5">
        <div className="flex justify-between">
          <span className="font-bold">Payment Method:</span>
          <span>{data.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Payment Status:</span>
          <span className="font-semibold uppercase">{data.paymentStatus}</span>
        </div>
        {data.customerNotes && (
          <div className="pt-1 border-t border-dashed border-black/30">
            <span className="font-bold">Customer Note: </span>
            <span className="italic">{data.customerNotes}</span>
          </div>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-b border-dashed border-black my-2" />

      {/* Receipt Footer */}
      <div className="text-center pt-0.5 pb-2 text-[10px] leading-relaxed space-y-0.5">
        <p className="font-bold uppercase tracking-wider text-[11px]">
          THANK YOU FOR SHOPPING WITH US!
        </p>
        <p className="text-black/80">
          Crafted with uncompromising attention to detail
        </p>
        <p className="text-[9.5px] text-black/75">
          {data.storeWebsite} • care@rustrevive.store
        </p>
        <p className="text-[8.5px] text-black/50 pt-1 tracking-widest">
          *** POS THERMAL RECEIPT • 80MM ***
        </p>
      </div>
    </div>
  );
}
