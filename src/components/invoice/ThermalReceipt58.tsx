import React from "react";
import type { InvoiceData } from "@/types/invoice.types";

interface ThermalReceipt58Props {
  data: InvoiceData;
}

/**
 * EXACT 58mm Thermal Receipt Component
 * Physical Width: 58mm (exact)
 * Height: Dynamic
 * Safe Internal Printable Area: ~48-52mm
 */
export function ThermalReceipt58({ data }: ThermalReceipt58Props) {
  const { customer, items } = data;

  return (
    <div
      className="thermal-receipt-58 bg-white text-black font-mono text-[11px] leading-[1.25] antialiased select-none"
      style={{
        width: "58mm",
        minWidth: "58mm",
        maxWidth: "58mm",
        boxSizing: "border-box",
        padding: "2mm 2.5mm",
        margin: "0 auto",
        overflow: "hidden",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {/* Brand Header */}
      <div className="text-center pb-1">
        <h1 className="text-[14px] font-bold tracking-wider uppercase leading-tight">
          {data.brandName}
        </h1>
        <p className="text-[9.5px] uppercase tracking-wide text-black/85 mt-0.5">
          {data.tagline}
        </p>
        <p className="text-[9px] text-black/75 mt-0.5">
          {data.storeAddress}
        </p>
        <p className="text-[9px] text-black/75">
          {data.storeEmail}
        </p>
      </div>

      {/* Dashed Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* Order Reference & Date */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between font-bold">
          <span>ORDER:</span>
          <span>{data.orderNumber}</span>
        </div>
        <div className="flex justify-between text-black/90">
          <span>DATE:</span>
          <span>{data.date} {data.time}</span>
        </div>
      </div>

      {/* Dashed Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* Customer & Delivery Destination */}
      <div className="space-y-0.5 text-[10px]">
        <div>
          <span className="font-bold">CUSTOMER: </span>
          <span>{customer.name}</span>
        </div>
        <div>
          <span className="font-bold">PHONE: </span>
          <span>{customer.phone}</span>
        </div>
        <div>
          <span className="font-bold">DELIVERY: </span>
          <span>{customer.fullAddress}</span>
        </div>
      </div>

      {/* Dashed Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* Product Section Header */}
      <div className="flex justify-between font-bold text-[10px] pb-0.5 border-b border-black">
        <span>ITEM / DETAILS</span>
        <span>TOTAL</span>
      </div>

      {/* Product Items List */}
      <div className="divide-y divide-dashed divide-black/40 py-0.5">
        {items.map((item) => (
          <div key={item.id} className="py-1 space-y-0.5">
            <p className="font-bold text-[10.5px] leading-tight text-black">
              {item.title}
            </p>
            {item.variant && (
              <p className="text-[9.5px] text-black/80 font-normal">
                {item.variant}
              </p>
            )}
            <div className="flex justify-between text-[10px] pt-0.5">
              <span className="text-black/85">
                {item.quantity} × ৳{item.unitPrice.toLocaleString()}
              </span>
              <span className="font-bold">
                ৳{item.lineTotal.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashed Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* Financial Ledger Breakdown */}
      <div className="space-y-0.5 text-[10.5px]">
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
            <span>Discount:</span>
            <span>-৳{data.discountTotal.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Heavy Border Total Amount */}
      <div className="border-t-2 border-b-2 border-black my-1 py-1">
        <div className="flex justify-between items-baseline font-bold text-[13px]">
          <span>TOTAL:</span>
          <span>৳{data.grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment & Audit Info */}
      <div className="space-y-0.5 text-[10px] pt-0.5">
        <div className="flex justify-between">
          <span className="font-bold">Payment:</span>
          <span>{data.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Status:</span>
          <span className="uppercase">{data.paymentStatus}</span>
        </div>
        {data.customerNotes && (
          <div className="pt-0.5">
            <span className="font-bold">Note: </span>
            <span className="italic">{data.customerNotes}</span>
          </div>
        )}
      </div>

      {/* Dashed Divider */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* Footer & Thank You Note */}
      <div className="text-center pt-0.5 pb-2 text-[9.5px] leading-tight space-y-0.5">
        <p className="font-bold uppercase tracking-wider">
          Thank You For Your Order!
        </p>
        <p className="text-[9px] text-black/80">
          {data.storeWebsite}
        </p>
        <p className="text-[8px] text-black/60 pt-0.5">
          *** OFFICIAL SALE RECEIPT ***
        </p>
      </div>
    </div>
  );
}
