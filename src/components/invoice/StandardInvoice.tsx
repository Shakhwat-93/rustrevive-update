import React from "react";
import type { InvoiceData } from "@/types/invoice.types";

interface StandardInvoiceProps {
  data: InvoiceData;
}

export function StandardInvoice({ data }: StandardInvoiceProps) {
  const { customer, items } = data;

  return (
    <div className="invoice-standard w-full max-w-3xl mx-auto bg-white p-8 sm:p-12 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900">
      {/* Invoice Official Brand Header */}
      <div className="flex justify-between items-start border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-2xl font-serif tracking-[0.2em] font-bold text-slate-900 uppercase">
            {data.brandName}
          </h1>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            {data.tagline}
          </p>
          <p className="text-xs font-mono text-slate-600 mt-2">
            {data.storeAddress} • {data.storeEmail}
          </p>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
            INVOICE
          </span>
          <p className="font-mono text-sm font-bold text-slate-900 mt-2">{data.orderNumber}</p>
          <p className="text-xs font-mono text-slate-500">Date: {data.date}</p>
        </div>
      </div>

      {/* Customer & Billing/Shipping Destination */}
      <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs font-mono">
        <div>
          <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Billed & Shipped To:</h3>
          <p className="font-semibold text-slate-800">{customer.name}</p>
          <p className="text-slate-600">{customer.phone}</p>
          <p className="text-slate-600">{customer.addressLine1}</p>
          {customer.addressLine2 && <p className="text-slate-600">{customer.addressLine2}</p>}
          <p className="text-slate-600">
            {customer.city} {customer.area ? `, ${customer.area}` : ""}{" "}
            {customer.postalCode ? ` - ${customer.postalCode}` : ""}
          </p>
          <p className="text-slate-600">Bangladesh</p>
        </div>

        <div className="text-right space-y-1">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Terms:</h3>
          <p className="text-slate-600">
            Method: <span className="font-semibold text-slate-900">{data.paymentMethod}</span>
          </p>
          <p className="text-slate-600">
            Status: <span className="font-semibold text-slate-900">{data.paymentStatus}</span>
          </p>
          <p className="text-slate-600">
            Currency: <span className="font-semibold text-slate-900">BDT (৳)</span>
          </p>
          {data.customerNotes && (
            <p className="text-slate-600 pt-2 text-left sm:text-right">
              <span className="font-semibold text-slate-900">Notes:</span> {data.customerNotes}
            </p>
          )}
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
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  {item.variant && <p className="text-[10px] text-slate-500">{item.variant}</p>}
                </td>
                <td className="py-3 text-slate-600">{item.sku}</td>
                <td className="py-3 text-right text-slate-800">৳{item.unitPrice.toLocaleString()}</td>
                <td className="py-3 text-right text-slate-800">{item.quantity}</td>
                <td className="py-3 text-right font-semibold text-slate-900">
                  ৳{item.lineTotal.toLocaleString()}
                </td>
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
            <span>৳{data.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span>৳{data.shippingTotal.toLocaleString()}</span>
          </div>
          {data.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>-৳{data.discountTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-900">
            <span>Grand Total</span>
            <span>৳{data.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Invoice Footer Guarantee */}
      <div className="border-t border-slate-200 pt-6 text-center text-[10px] font-mono text-slate-400">
        <p>{data.thankYouMessage}</p>
        <p className="mt-1">For any queries regarding this invoice, please reach out to care@rustrevive.store</p>
      </div>
    </div>
  );
}
